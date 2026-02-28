'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::community.community', ({ strapi }) => ({

  // Public read — list all communities
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi
      .service('api::community.community')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // Public read — single community with visible members and reunions
  async findOne(ctx) {
    const { id: documentId } = ctx.params;
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community.community')
      .findOne(documentId, sanitizedQuery);
    if (!entity) return ctx.notFound();

    // Filter members to only visible profiles
    if (entity.members) {
      entity.members = entity.members.filter((m) => m.isVisible);
    }

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — only accompagnants can create communities
  async create(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    // Vérifier que l'utilisateur est un accompagnant
    // (a envoyé au moins une demande de compagnonnage acceptée)
    const acceptedRequests = await strapi
      .documents('api::companion-request.companion-request')
      .findMany({
        filters: {
          requester: { id: ctx.state.user.id },
          status: 'accepted',
        },
        limit: 1,
      });
    if (acceptedRequests.length === 0) {
      return ctx.forbidden('Seuls les accompagnants peuvent créer des communautés.');
    }

    // Find the user's community profile
    const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const myProfile = profiles[0];
    if (!myProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire avant de créer une communauté.');
    }

    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const data = {
      ...(sanitizedBody.data || {}),
      admins: [myProfile.documentId],
      members: [myProfile.documentId],
    };
    const entity = await strapi.documents('api::community.community').create({ data });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — only admins can update
  async update(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community.community').findOne({
      documentId,
      populate: { admins: { populate: { user: { fields: ['id'] } } } },
    });
    if (!existing) return ctx.notFound();

    const isAdmin = (existing.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isAdmin) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const sanitizedBody = await this.sanitizeInput(ctx.request.body, ctx);
    const entity = await strapi
      .service('api::community.community')
      .update(documentId, { ...sanitizedQuery, ...sanitizedBody });
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Auth required — only admins can delete
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents('api::community.community').findOne({
      documentId,
      populate: { admins: { populate: { user: { fields: ['id'] } } } },
    });
    if (!existing) return ctx.notFound();

    const isAdmin = (existing.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isAdmin) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi
      .service('api::community.community')
      .delete(documentId, sanitizedQuery);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Custom: join a community
  async join(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const myProfile = profiles[0];
    if (!myProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire.');
    }

    const community = await strapi.documents('api::community.community').findOne({
      documentId,
      populate: { members: { fields: ['id', 'documentId'] } },
    });
    if (!community) return ctx.notFound();

    const alreadyMember = (community.members || []).some((m) => m.documentId === myProfile.documentId);
    if (alreadyMember) {
      return ctx.badRequest('Vous êtes déjà membre de cette communauté.');
    }

    const memberIds = (community.members || []).map((m) => m.documentId);
    memberIds.push(myProfile.documentId);

    const updated = await strapi.documents('api::community.community').update({
      documentId,
      data: { members: memberIds },
    });
    const sanitizedEntity = await this.sanitizeOutput(updated, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // Custom: leave a community
  async leave(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const myProfile = profiles[0];
    if (!myProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire.');
    }

    const community = await strapi.documents('api::community.community').findOne({
      documentId,
      populate: {
        members: { fields: ['id', 'documentId'] },
        admins: { fields: ['id', 'documentId'] },
      },
    });
    if (!community) return ctx.notFound();

    // Prevent last admin from leaving
    const isAdmin = (community.admins || []).some((a) => a.documentId === myProfile.documentId);
    if (isAdmin && community.admins.length === 1) {
      return ctx.badRequest('Vous êtes le seul administrateur. Nommez un autre admin avant de quitter.');
    }

    const memberIds = (community.members || [])
      .filter((m) => m.documentId !== myProfile.documentId)
      .map((m) => m.documentId);

    const adminIds = isAdmin
      ? (community.admins || [])
          .filter((a) => a.documentId !== myProfile.documentId)
          .map((a) => a.documentId)
      : undefined;

    const updateData = { members: memberIds };
    if (adminIds) updateData.admins = adminIds;

    const updated = await strapi.documents('api::community.community').update({
      documentId,
      data: updateData,
    });
    const sanitizedEntity = await this.sanitizeOutput(updated, ctx);
    return this.transformResponse(sanitizedEntity);
  },
}));
