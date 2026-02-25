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

  // Auth required — only community admins can create reunions
  async create(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const data = sanitizedBody.data || {};

    // A community must be specified
    if (!data.community) {
      return ctx.badRequest('Une réunion doit être rattachée à une communauté.');
    }

    // Find the user's community profile
    const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const myProfile = profiles[0];
    if (!myProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire avant de créer une réunion.');
    }

    // Check that user is admin of the specified community
    const community = await strapi.documents('api::community.community').findOne({
      documentId: data.community,
      populate: { admins: { populate: { user: { fields: ['id'] } } } },
    });
    if (!community) {
      return ctx.badRequest('Communauté introuvable.');
    }

    const isAdmin = (community.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isAdmin) {
      return ctx.forbidden('Seuls les administrateurs de la communauté peuvent créer des réunions.');
    }

    const createData = {
      ...data,
      createdByMember: myProfile.documentId,
    };
    const entity = await strapi.documents('api::community-group.community-group').create({ data: createData });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — verify creator or community admin
  async update(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community-group.community-group').findOne({
      documentId,
      populate: {
        createdByMember: { populate: { user: { fields: ['id'] } } },
        community: { populate: { admins: { populate: { user: { fields: ['id'] } } } } },
      },
    });
    if (!existing) return ctx.notFound();

    const isCreator = existing.createdByMember?.user?.id === ctx.state.user.id;
    const isAdmin = (existing.community?.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isCreator && !isAdmin) {
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

  // Auth required — verify creator or community admin
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community-group.community-group').findOne({
      documentId,
      populate: {
        createdByMember: { populate: { user: { fields: ['id'] } } },
        community: { populate: { admins: { populate: { user: { fields: ['id'] } } } } },
      },
    });
    if (!existing) return ctx.notFound();

    const isCreator = existing.createdByMember?.user?.id === ctx.state.user.id;
    const isAdmin = (existing.community?.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isCreator && !isAdmin) {
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
