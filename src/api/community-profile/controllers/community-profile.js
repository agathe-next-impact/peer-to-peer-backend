'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::community-profile.community-profile', ({ strapi }) => ({

  /**
   * find — si ?mine=true et utilisateur connecté, retourne le profil de
   * l'utilisateur (même non visible). Sinon, retourne les profils visibles.
   */
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    if (ctx.query.mine === 'true' && ctx.state.user) {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        user: { id: ctx.state.user.id },
      };
      sanitizedQuery.pagination = { limit: 1 };
    } else {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        isVisible: true,
      };
    }

    const { results, pagination } = await strapi
      .service('api::community-profile.community-profile')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // findOne — profil visible uniquement (+ flag isOwnProfile)
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
