'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::community-profile.community-profile', ({ strapi }) => ({

  // Public read — only visible profiles
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    sanitizedQuery.filters = {
      ...(sanitizedQuery.filters || {}),
      isVisible: true,
    };
    const { results, pagination } = await strapi
      .service('api::community-profile.community-profile')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // Public read — only if visible
  async findOne(ctx) {
    const { id: documentId } = ctx.params;
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community-profile.community-profile')
      .findOne(documentId, sanitizedQuery);
    if (!entity || !entity.isVisible) return ctx.notFound();
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
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
