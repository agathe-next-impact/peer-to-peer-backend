'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const REQUEST_UID = 'api::companion-request.companion-request';

/**
 * Retourne les IDs des utilisateurs qui accompagnent le user courant
 * (requester des CompanionRequest acceptées où le user courant est target).
 * Un accompagné ne doit pas voir le profil communautaire de ses accompagnants.
 */
async function getAccompagnantUserIds(strapi, currentUserId) {
  const acceptedRequests = await strapi.documents(REQUEST_UID).findMany({
    filters: {
      target: { id: currentUserId },
      status: 'accepted',
    },
    populate: { requester: { fields: ['id'] } },
  });

  return acceptedRequests
    .map((r) => r.requester?.id)
    .filter(Boolean);
}

module.exports = createCoreController('api::community-profile.community-profile', ({ strapi }) => ({

  /**
   * find — si ?mine=true et utilisateur connecté, retourne le profil de
   * l'utilisateur (même non visible). Sinon, retourne les profils visibles.
   * Si ?community=<documentId>, filtre par membres de cette communauté.
   * Exclut les profils des accompagnants pour les accompagnés.
   */
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    if (ctx.query.mine === 'true' && ctx.state.user) {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        user: { id: ctx.state.user.id },
      };
      sanitizedQuery.pagination = { limit: 1 };
    } else if (ctx.query.community && ctx.state.user) {
      // Filter by community membership — only visible members
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        isVisible: true,
        communities: { documentId: ctx.query.community },
      };
    } else {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        isVisible: true,
      };
    }

    // Search by pseudonym
    if (ctx.query.search) {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        pseudonym: { $containsi: ctx.query.search },
      };
    }

    // Search by email (for community invitation — exact match)
    if (ctx.query.searchEmail && ctx.state.user) {
      const targetUser = await strapi.db
        .query('plugin::users-permissions.user')
        .findOne({ where: { email: ctx.query.searchEmail.trim().toLowerCase() } });

      if (targetUser) {
        sanitizedQuery.filters = {
          ...(sanitizedQuery.filters || {}),
          user: { id: targetUser.id },
        };
      } else {
        // Aucun utilisateur trouvé → résultat vide
        return this.transformResponse([], { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } });
      }
    }

    // Filtrer uniquement les accompagnés (targets de companion-requests acceptées)
    if (ctx.query.accompagneOnly === 'true' && ctx.state.user) {
      const acceptedRequests = await strapi.documents(REQUEST_UID).findMany({
        filters: { status: 'accepted' },
        populate: { target: { fields: ['id'] } },
        limit: 10000,
      });
      const accompagneUserIds = [...new Set(
        acceptedRequests.map((r) => r.target?.id).filter(Boolean)
      )];
      if (accompagneUserIds.length > 0) {
        sanitizedQuery.filters = {
          $and: [
            sanitizedQuery.filters || {},
            { user: { id: { $in: accompagneUserIds } } },
          ],
        };
      } else {
        return this.transformResponse([], { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } });
      }
    }

    // Un accompagné ne voit pas les profils de ses accompagnants
    if (ctx.state.user && ctx.query.mine !== 'true') {
      const accompagnantUserIds = await getAccompagnantUserIds(strapi, ctx.state.user.id);
      if (accompagnantUserIds.length > 0) {
        sanitizedQuery.filters = {
          $and: [
            sanitizedQuery.filters || {},
            { user: { id: { $notIn: accompagnantUserIds } } },
          ],
        };
      }
    }

    const { results, pagination } = await strapi
      .service('api::community-profile.community-profile')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // findOne — profil visible uniquement (+ flag isOwnProfile)
  // Exclut les profils des accompagnants pour les accompagnés.
  async findOne(ctx) {
    const { id: documentId } = ctx.params;
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    const entity = await strapi
      .service('api::community-profile.community-profile')
      .findOne(documentId, {
        ...sanitizedQuery,
        populate: { ...(sanitizedQuery.populate || {}), user: { fields: ['id'] } },
      });
    if (!entity || !entity.isVisible) return ctx.notFound();

    // Un accompagné ne voit pas le profil de son accompagnant
    if (ctx.state.user && entity.user?.id) {
      const accompagnantUserIds = await getAccompagnantUserIds(strapi, ctx.state.user.id);
      if (accompagnantUserIds.includes(entity.user.id)) {
        return ctx.notFound();
      }
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);

    // Indicateur pour le frontend (n'expose pas le userId)
    if (ctx.state.user && entity.user?.id === ctx.state.user.id) {
      sanitizedEntity.isOwnProfile = true;
    }

    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — force user ownership
  async create(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const data = {
      ...(sanitizedBody.data || {}),
      user: ctx.state.user.id,
      joinedAt: new Date().toISOString().split('T')[0],
    };
    const entity = await strapi.documents('api::community-profile.community-profile').create({ data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — verify ownership
  async update(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;
    const existing = await strapi.documents('api::community-profile.community-profile').findOne({
      documentId,
      populate: { user: { fields: ['id'] } },
    });
    if (!existing || existing.user?.id !== ctx.state.user.id) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const entity = await strapi
      .service('api::community-profile.community-profile')
      .update(documentId, { ...sanitizedQuery, ...sanitizedBody });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — verify ownership
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;
    const existing = await strapi.documents('api::community-profile.community-profile').findOne({
      documentId,
      populate: { user: { fields: ['id'] } },
    });
    if (!existing || existing.user?.id !== ctx.state.user.id) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community-profile.community-profile')
      .delete(documentId, sanitizedQuery);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
