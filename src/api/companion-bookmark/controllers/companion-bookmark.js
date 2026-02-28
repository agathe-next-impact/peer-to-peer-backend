'use strict';

/**
 * Controller personnalisé pour companion-bookmark.
 *
 * Ne passe PAS par createPrivateController car il a besoin de :
 *  - Empêcher l'auto-bookmark (self-bookmark check)
 *  - Injecter companion.userId après sanitisation (le champ user est strippé
 *    par sanitizeOutput car il pointe vers users-permissions)
 *
 * Reprend la logique owner-filtering + décryptage du private-controller.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { decryptFields, getEncryptionInfo } = require('../../../extensions/encryption/lifecycle');

const uid = 'api::companion-bookmark.companion-bookmark';

module.exports = createCoreController(uid, ({ strapi }) => {
  const { fields: encryptedFields } = getEncryptionInfo(uid, strapi);

  function decryptEntity(entity) {
    if (!entity || encryptedFields.length === 0) return entity;
    return decryptFields(entity, encryptedFields);
  }

  function decryptMany(entities) {
    if (!Array.isArray(entities)) return entities;
    return entities.map(decryptEntity);
  }

  return {

    // ── FIND ──────────────────────────────────────────────────────────────
    async find(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const sanitizedQuery = await this.sanitizeQuery(ctx);

      // Forcer le filtre owner
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        owner: { id: ctx.state.user.id },
      };

      // Forcer le populate de companion.user.id (strippé par sanitizeQuery)
      sanitizedQuery.populate = sanitizedQuery.populate || {};
      sanitizedQuery.populate.companion = sanitizedQuery.populate.companion || {};
      sanitizedQuery.populate.companion.populate = {
        ...(sanitizedQuery.populate.companion.populate || {}),
        user: { fields: ['id'] },
      };

      const { results, pagination } = await strapi.service(uid).find(sanitizedQuery);
      const decryptedResults = decryptMany(results);
      const sanitizedResults = await this.sanitizeOutput(decryptedResults, ctx);

      // Ré-injecter companion.userId après sanitisation
      // (sanitizeOutput strip la relation users-permissions)
      for (let i = 0; i < sanitizedResults.length; i++) {
        if (sanitizedResults[i]?.companion && results[i]?.companion?.user) {
          sanitizedResults[i].companion.userId = results[i].companion.user.id;
        }
      }

      return this.transformResponse(sanitizedResults, { pagination });
    },

    // ── FIND ONE ─────────────────────────────────────────────────────────
    async findOne(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const { id: documentId } = ctx.params;
      const sanitizedQuery = await this.sanitizeQuery(ctx);

      // Construire le populate : owner (pour le check) + companion avec user
      sanitizedQuery.populate = sanitizedQuery.populate || {};
      sanitizedQuery.populate.owner = { fields: ['id'] };
      sanitizedQuery.populate.companion = sanitizedQuery.populate.companion || {};
      sanitizedQuery.populate.companion.populate = {
        ...(sanitizedQuery.populate.companion.populate || {}),
        user: { fields: ['id'] },
      };

      const entity = await strapi.documents(uid).findOne({
        documentId,
        populate: sanitizedQuery.populate,
      });

      if (!entity || entity.owner?.id !== ctx.state.user.id) {
        return ctx.notFound();
      }

      const decryptedEntity = decryptEntity(entity);
      const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);

      // Ré-injecter companion.userId après sanitisation
      // (sanitizeOutput strip la relation users-permissions)
      if (sanitizedEntity?.companion && entity?.companion?.user) {
        sanitizedEntity.companion.userId = entity.companion.user.id;
      }

      return this.transformResponse(sanitizedEntity);
    },

    // ── CREATE ────────────────────────────────────────────────────────────
    async create(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
      const companionDocId = ctx.request.body?.data?.companion;


      // Empêcher l'auto-bookmark
      if (companionDocId) {
        const profile = await strapi
          .documents('api::community-profile.community-profile')
          .findOne({
            documentId: String(companionDocId),
            populate: { user: { fields: ['id'] } },
          });

        if (profile?.user?.id === ctx.state.user.id) {
          return ctx.badRequest(
            'Vous ne pouvez pas vous ajouter vous-même comme compagnon.'
          );
        }
      }

      const data = { ...(sanitizedBody.data || {}), owner: ctx.state.user.id };

      try {
        const entity = await strapi.documents(uid).create({ data });
        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      } catch (err) {
        throw err;
      }
    },

    // ── UPDATE ────────────────────────────────────────────────────────────
    async update(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const { id: documentId } = ctx.params;

      const existing = await strapi.documents(uid).findOne({
        documentId,
        populate: { owner: { fields: ['id'] } },
      });
      if (!existing || existing.owner?.id !== ctx.state.user.id) {
        return ctx.forbidden();
      }

      const sanitizedQuery = await this.sanitizeQuery(ctx);
      const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

      const entity = await strapi.service(uid).update(documentId, {
        ...sanitizedQuery,
        ...sanitizedBody,
      });
      const decryptedEntity = decryptEntity(entity);
      const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
      return this.transformResponse(sanitizedEntity);
    },

    // ── DELETE ────────────────────────────────────────────────────────────
    async delete(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const { id: documentId } = ctx.params;

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

    // ── REVOKE (bilateral) ────────────────────────────────────────────────
    async revoke(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const { id: documentId } = ctx.params;
      const currentUserId = ctx.state.user.id;

      const ACCESS_UID = 'api::companion-access.companion-access';
      const REQUEST_UID = 'api::companion-request.companion-request';

      // 1. Trouver le bookmark avec owner + companion.user
      const bookmark = await strapi.documents(uid).findOne({
        documentId,
        populate: {
          owner: { fields: ['id'] },
          companion: { populate: { user: { fields: ['id'] } } },
        },
      });

      if (!bookmark || bookmark.owner?.id !== currentUserId) {
        return ctx.forbidden();
      }

      const otherUserId = bookmark.companion?.user?.id;
      if (!otherUserId) {
        return ctx.badRequest('Impossible de déterminer l\'autre utilisateur.');
      }

      // 2. Supprimer le bookmark du user courant
      await strapi.documents(uid).delete({ documentId });

      // 3. Trouver et supprimer le bookmark inverse (other → current)
      const reverseBookmarks = await strapi.documents(uid).findMany({
        filters: { owner: { id: otherUserId } },
        populate: { companion: { populate: { user: { fields: ['id'] } } } },
      });
      for (const rb of reverseBookmarks) {
        if (rb.companion?.user?.id === currentUserId) {
          await strapi.documents(uid).delete({ documentId: rb.documentId });
        }
      }

      // 4. Supprimer tous les CompanionAccess current → other
      const accessesAB = await strapi.documents(ACCESS_UID).findMany({
        filters: { owner: { id: currentUserId }, companion: { id: otherUserId } },
      });
      for (const a of accessesAB) {
        await strapi.documents(ACCESS_UID).delete({ documentId: a.documentId });
      }

      // 5. Supprimer tous les CompanionAccess other → current
      const accessesBA = await strapi.documents(ACCESS_UID).findMany({
        filters: { owner: { id: otherUserId }, companion: { id: currentUserId } },
      });
      for (const a of accessesBA) {
        await strapi.documents(ACCESS_UID).delete({ documentId: a.documentId });
      }

      // 6. Mettre à jour les CompanionRequest accepted entre les deux → cancelled
      const requests = await strapi.documents(REQUEST_UID).findMany({
        filters: {
          status: 'accepted',
          $or: [
            { requester: { id: currentUserId }, target: { id: otherUserId } },
            { requester: { id: otherUserId }, target: { id: currentUserId } },
          ],
        },
      });
      for (const r of requests) {
        await strapi.documents(REQUEST_UID).update({
          documentId: r.documentId,
          data: { status: 'cancelled' },
        });
      }

      return { data: null };
    },
  };
});
