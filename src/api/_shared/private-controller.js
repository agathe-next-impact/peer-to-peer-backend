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
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { decryptFields, getEncryptionInfo } = require('../../extensions/encryption/lifecycle');
const { validateJsonFields } = require('./validate-json-fields');

function createPrivateController(uid) {
  return createCoreController(uid, ({ strapi }) => {

    // Récupérer les champs chiffrés pour ce content-type
    const { fields: encryptedFields } = getEncryptionInfo(uid, strapi);

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

    return {

      // ── FIND ────────────────────────────────────────────────────────────
      async find(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const sanitizedQuery = await this.sanitizeQuery(ctx);

        // Injecte le filtre owner APRÈS la sanitization
        sanitizedQuery.filters = {
          ...(sanitizedQuery.filters || {}),
          owner: { id: ctx.state.user.id },
        };

        const { results, pagination } = await strapi.service(uid).find(sanitizedQuery);
        const decryptedResults = decryptMany(results);
        const sanitizedResults = await this.sanitizeOutput(decryptedResults, ctx);
        return this.transformResponse(sanitizedResults, { pagination });
      },

      // ── FIND ONE ────────────────────────────────────────────────────────
      async findOne(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const { id: documentId } = ctx.params;
        const sanitizedQuery = await this.sanitizeQuery(ctx);

        const entity = await strapi.service(uid).findOne(documentId, {
          ...sanitizedQuery,
          populate: { ...(sanitizedQuery.populate || {}), owner: { fields: ['id'] } },
        });

        if (!entity) return ctx.notFound();
        if (entity.owner?.id !== ctx.state.user.id) return ctx.forbidden();

        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

      // ── CREATE ──────────────────────────────────────────────────────────
      async create(ctx) {
        if (!ctx.state.user) return ctx.forbidden();

        const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

        // Valider les champs JSON avant persistence
        try {
          validateJsonFields(sanitizedBody.data || {}, uid, strapi);
        } catch (err) {
          return ctx.badRequest(err.message);
        }

        // Force le owner APRÈS la sanitization (la sanitization le supprime)
        const data = { ...(sanitizedBody.data || {}), owner: ctx.state.user.id };

        const entity = await strapi.documents(uid).create({ data });
        const decryptedEntity = decryptEntity(entity);
        const sanitizedEntity = await this.sanitizeOutput(decryptedEntity, ctx);
        return this.transformResponse(sanitizedEntity);
      },

      // ── UPDATE ──────────────────────────────────────────────────────────
      async update(ctx) {
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

        // Sanitize puis appeler le service
        const sanitizedQuery = await this.sanitizeQuery(ctx);
        const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);

        // Valider les champs JSON avant persistence
        try {
          validateJsonFields(sanitizedBody.data || {}, uid, strapi);
        } catch (err) {
          return ctx.badRequest(err.message);
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
