'use strict';

/**
 * Factory qui crée un controller avec isolation par owner + déchiffrement.
 *
 * Pour chaque content-type privé, le controller :
 *  - find / findOne : injecte le filtre owner APRÈS la sanitization REST API
 *  - create : force le champ owner APRÈS la sanitization du body
 *  - update / delete : vérifie que l'entrée appartient à l'utilisateur
 *  - TOUS : déchiffre les champs sensibles avant de retourner la réponse
 *
 * Le déchiffrement gère deux formats :
 *  - string direct "v1:iv:tag:cipher" (champs string/text)
 *  - wrapper JSON { __encrypted: "v1:..." } (champs json/jsonb)
 *
 * Paramètre optionnel `?shared_by=<userId>` :
 *  - Permet à un compagnon d'accéder aux données d'un autre utilisateur
 *  - Vérifie qu'un companion-access valide existe pour la section concernée
 *  - read : autorise find/findOne uniquement
 *  - readwrite : autorise aussi create/update
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { decryptFields, getEncryptionInfo } = require('../../extensions/encryption/lifecycle');
const { validateJsonFields } = require('./validate-json-fields');

// Mapping section → content-type UIDs
const SECTION_MAP = {
  se_connaitre: [
    'api::self-assessment.self-assessment',
    'api::situation-observation.situation-observation',
    'api::early-warning-sign.early-warning-sign',
    'api::situation-thesaurus.situation-thesaurus',
    'api::situation-objective.situation-objective',
    'api::recovery-profile.recovery-profile',
    'api::self-determined-profile.self-determined-profile',
  ],
  agir: [
    'api::personal-goal.personal-goal',
    'api::self-problem-solving.self-problem-solving',
  ],
  gerer: [
    'api::personal-notebook.personal-notebook',
    'api::personal-calendar-event.personal-calendar-event',
    'api::recovery-profile.recovery-profile',
    'api::wellness-checkin.wellness-checkin',
    'api::wellness-tracker-config.wellness-tracker-config',
    'api::recovery-tracking.recovery-tracking',
  ],
};

/**
 * Trouve toutes les sections auxquelles appartient un content-type UID.
 * Un UID peut apparaître dans plusieurs sections (ex: recovery-profile).
 */
function getSectionsForUid(uid) {
  const sections = [];
  for (const [section, uids] of Object.entries(SECTION_MAP)) {
    if (uids.includes(uid)) sections.push(section);
  }
  return sections;
}

/**
 * Vérifie qu'un companion-access valide existe.
 * @returns {{ section, permission }} ou null
 */
async function getCompanionAccess(companionUserId, ownerUserId, requiredSection, strapi) {
  const accesses = await strapi.documents('api::companion-access.companion-access').findMany({
    filters: {
      owner: { id: ownerUserId },
      companion: { id: companionUserId },
      section: requiredSection,
    },
    limit: 1,
  });
  return accesses.length > 0 ? accesses[0] : null;
}

function createPrivateController(uid) {
  return createCoreController(uid, ({ strapi }) => {

    // Récupérer les champs chiffrés pour ce content-type
    const { fields: encryptedFields } = getEncryptionInfo(uid, strapi);

    // Détecter les champs relation non-owner du schéma.
    // sanitizeInput supprime les relations (owner, mais aussi template, observation…).
    // On les ré-injecte après sanitization dans create/update.
    const schema = strapi.contentType(uid);
    const nonOwnerRelationFields = Object.entries(schema.attributes || {})
      .filter(([key, attr]) => attr.type === 'relation' && key !== 'owner')
      .map(([key]) => key);

    // Sections auxquelles appartient ce content-type (pour vérification companion-access)
    const contentTypeSections = getSectionsForUid(uid);

    /**
     * Déchiffre les champs sensibles d'une entité.
     */
    function decryptEntity(entity) {
      if (!entity || encryptedFields.length === 0) return entity;
      return decryptFields(entity, encryptedFields);
    }

    /**
     * Déchiffre un tableau d'entités.
     */
    function decryptMany(entities) {
      if (!Array.isArray(entities)) return entities;
      return entities.map(decryptEntity);
    }

    /**
     * Vérifie l'accès compagnon pour le shared_by courant.
     * Itère sur toutes les sections possibles du content-type.
     * Retourne l'objet access ou null si aucun accès valide.
     * @param {string} minPermission - 'read' ou 'readwrite'
     */
    async function checkSharedAccess(ctx, sharedByUserId, minPermission) {
      if (contentTypeSections.length === 0) return null; // content-type non mappé

      for (const section of contentTypeSections) {
        const access = await getCompanionAccess(
          ctx.state.user.id,
          Number(sharedByUserId),
          section,
          strapi
        );
        if (!access) continue;
        if (minPermission === 'readwrite' && access.permission !== 'readwrite') continue;
        return access;
      }
      return null;
    }

    return {

      // ── FIND ────────────────────────────────────────────────────────────
      async find(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const sharedBy = ctx.query.shared_by;
        const sanitizedQuery = await this.sanitizeQuery(ctx);

        if (sharedBy) {
          // Mode compagnon : vérifier l'accès
          const access = await checkSharedAccess(ctx, sharedBy, 'read');
          if (!access) return ctx.forbidden('Accès compagnon non autorisé.');

          sanitizedQuery.filters = {
            ...(sanitizedQuery.filters || {}),
            owner: { id: Number(sharedBy) },
          };
        } else {
          // Mode normal : mes propres données
          sanitizedQuery.filters = {
            ...(sanitizedQuery.filters || {}),
            owner: { id: ctx.state.user.id },
          };
        }

        const { results, pagination } = await strapi.service(uid).find(sanitizedQuery);
        const decryptedResults = decryptMany(results);
        const sanitizedResults = await this.sanitizeOutput(decryptedResults, ctx);
        return this.transformResponse(sanitizedResults, { pagination });
      },

      // ── FIND ONE ────────────────────────────────────────────────────────
      async findOne(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const { id: documentId } = ctx.params;
        const sharedBy = ctx.query.shared_by;
        const sanitizedQuery = await this.sanitizeQuery(ctx);

        const entity = await strapi.service(uid).findOne(documentId, {
          ...sanitizedQuery,
          populate: { ...(sanitizedQuery.populate || {}), owner: { fields: ['id'] } },
        });

        if (!entity) return ctx.notFound();

        if (sharedBy) {
          // Mode compagnon : vérifier que l'entité appartient au shared_by et qu'on a l'accès
          if (entity.owner?.id !== Number(sharedBy)) return ctx.forbidden();
          const access = await checkSharedAccess(ctx, sharedBy, 'read');
          if (!access) return ctx.forbidden('Accès compagnon non autorisé.');
        } else {
          // Mode normal
          if (entity.owner?.id !== ctx.state.user.id) return ctx.forbidden();
        }

        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

      // ── CREATE ──────────────────────────────────────────────────────────
      async create(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const sharedBy = ctx.query.shared_by;
        let ownerId = ctx.state.user.id;

        if (sharedBy) {
          // Mode compagnon : vérifier l'accès readwrite
          const access = await checkSharedAccess(ctx, sharedBy, 'readwrite');
          if (!access) return ctx.forbidden('Accès compagnon en écriture non autorisé.');
          ownerId = Number(sharedBy);
        }

        const rawData = ctx.request.body?.data || {};
        const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

        // Valider les champs JSON avant persistence
        try {
          validateJsonFields(sanitizedBody.data || {}, uid, strapi);
        } catch (err) {
          return ctx.badRequest(err.message);
        }

        // Force le owner APRÈS la sanitization (la sanitization le supprime).
        // Ré-injecte aussi les relations non-owner (template, observation…)
        // que sanitizeInput supprime également.
        const data = { ...(sanitizedBody.data || {}), owner: ownerId };
        for (const field of nonOwnerRelationFields) {
          if (rawData[field] !== undefined && data[field] === undefined) {
            data[field] = rawData[field];
          }
        }

        const entity = await strapi.documents(uid).create({ data });
        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

      // ── UPDATE ──────────────────────────────────────────────────────────
      async update(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const { id: documentId } = ctx.params;
        const sharedBy = ctx.query.shared_by;

        // Vérifier ownership ou accès compagnon
        const existing = await strapi.documents(uid).findOne({
          documentId,
          populate: { owner: { fields: ['id'] } },
        });

        if (!existing) return ctx.notFound();

        if (sharedBy) {
          if (existing.owner?.id !== Number(sharedBy)) return ctx.forbidden();
          const access = await checkSharedAccess(ctx, sharedBy, 'readwrite');
          if (!access) return ctx.forbidden('Accès compagnon en écriture non autorisé.');
        } else {
          if (existing.owner?.id !== ctx.state.user.id) return ctx.forbidden();
        }

        // Sanitize puis appeler le service
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const rawUpdateData = ctx.request.body?.data || {};
        const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

        // Valider les champs JSON avant persistence
        try {
          validateJsonFields(sanitizedBody.data || {}, uid, strapi);
        } catch (err) {
          return ctx.badRequest(err.message);
        }

        // Ré-injecter les relations non-owner supprimées par sanitizeInput
        if (sanitizedBody.data) {
          for (const field of nonOwnerRelationFields) {
            if (rawUpdateData[field] !== undefined && sanitizedBody.data[field] === undefined) {
              sanitizedBody.data[field] = rawUpdateData[field];
            }
          }
        }

        const entity = await strapi.service(uid).update(documentId, {
          ...sanitizedQuery,
          ...sanitizedBody,
        });
        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

      // ── DELETE ──────────────────────────────────────────────────────────
      // Seul l'owner peut supprimer — pas d'accès compagnon
      async delete(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const { id: documentId } = ctx.params;

        // Vérifier ownership
        const existing = await strapi.documents(uid).findOne({
          documentId,
          populate: { owner: { fields: ['id'] } },
        });
        if (!existing || existing.owner?.id !== ctx.state.user.id) {
          return ctx.forbidden();
        }

        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const entity = await strapi.service(uid).delete(documentId, sanitizedQuery);
        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

    };
  });
}

module.exports = { createPrivateController };
