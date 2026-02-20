'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::community-group.community-group', ({ strapi }) => ({

  // Public read — standard
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi
      .service('api::community-group.community-group')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // Public read — standard
  async findOne(ctx) {
    const { id: documentId } = ctx.params;
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community-group.community-group')
      .findOne(documentId, sanitizedQuery);
    if (!entity) return ctx.notFound();
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — set createdByMember from user's community profile
  async create(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    // Find the user's community profile
    const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const myProfile = profiles[0];
    if (!myProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire avant de créer un groupe.');
    }

    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const data = {
      ...(sanitizedBody.data || {}),
      createdByMember: myProfile.documentId,
    };
    const entity = await strapi.documents('api::community-group.community-group').create({ data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — verify ownership via createdByMember
  async update(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community-group.community-group').findOne({
      documentId,
      populate: { createdByMember: { populate: { user: { fields: ['id'] } } } },
    });
    if (!existing) return ctx.notFound();
    if (!existing.createdByMember || existing.createdByMember.user?.id !== ctx.state.user.id) {
      return ctx.forbidden();
    }

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const entity = await strapi
      .service('api::community-group.community-group')
      .update(documentId, { ...sanitizedQuery, ...sanitizedBody });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — verify ownership via createdByMember
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community-group.community-group').findOne({
      documentId,
      populate: { createdByMember: { populate: { user: { fields: ['id'] } } } },
    });
    if (!existing) return ctx.notFound();
    if (!existing.createdByMember || existing.createdByMember.user?.id !== ctx.state.user.id) {
      return ctx.forbidden();
    }

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community-group.community-group')
      .delete(documentId, sanitizedQuery);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
