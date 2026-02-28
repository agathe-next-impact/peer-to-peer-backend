'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::event-registration.event-registration';
const GROUP_UID = 'api::community-group.community-group';
const PROFILE_UID = 'api::community-profile.community-profile';
const REQUEST_UID = 'api::companion-request.companion-request';

module.exports = createCoreController(UID, ({ strapi }) => ({

  // ── FIND ── owner-scoped + vue admin par communityGroup
  async find(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    // Vue admin : toutes les inscriptions d'une réunion
    if (ctx.query.communityGroup && ctx.state.user) {
      const group = await strapi.documents(GROUP_UID).findOne({
        documentId: ctx.query.communityGroup,
        populate: {
          community: {
            populate: { admins: { populate: { user: { fields: ['id'] } } } },
          },
        },
      });
      if (group) {
        const isAdmin = (group.community?.admins || []).some(
          (a) => a.user?.id === ctx.state.user.id
        );
        if (isAdmin) {
          sanitizedQuery.filters = {
            ...(sanitizedQuery.filters || {}),
            communityGroup: { documentId: ctx.query.communityGroup },
          };
          const { results, pagination } = await strapi.service(UID).find(sanitizedQuery);
          const sanitizedResults = await this.sanitizeOutput(results, ctx);
          return this.transformResponse(sanitizedResults, { pagination });
        }
      }
    }

    // Vue utilisateur : uniquement ses propres inscriptions
    sanitizedQuery.filters = {
      ...(sanitizedQuery.filters || {}),
      owner: { id: ctx.state.user.id },
    };
    const { results, pagination } = await strapi.service(UID).find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  // ── FIND ONE ── owner-scoped
  async findOne(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi.service(UID).findOne(documentId, {
      ...sanitizedQuery,
      populate: { ...(sanitizedQuery.populate || {}), owner: { fields: ['id'] } },
    });
    if (!entity) return ctx.notFound();
    if (entity.owner?.id !== ctx.state.user.id) return ctx.forbidden();
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // ── INVITE ── un admin invite un accompagné membre de la communauté
  async invite(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const body = ctx.request.body?.data || ctx.request.body || {};
    const { communityGroup: groupDocId, invitedProfile: invitedProfileDocId } = body;

    if (!groupDocId || !invitedProfileDocId) {
      return ctx.badRequest('Les champs communityGroup et invitedProfile sont requis.');
    }

    // 1. Charger le group avec sa community → admins et members
    const group = await strapi.documents(GROUP_UID).findOne({
      documentId: groupDocId,
      populate: {
        community: {
          populate: {
            admins: { populate: { user: { fields: ['id'] } } },
            members: { populate: { user: { fields: ['id'] } } },
          },
        },
      },
    });

    if (!group) return ctx.notFound('Réunion introuvable.');
    if (!group.community) return ctx.badRequest('Cette réunion n\'est rattachée à aucune communauté.');
    if (group.status !== 'active') return ctx.badRequest('Cette réunion n\'est pas active.');

    // 2. Vérifier que l'inviteur est admin de la communauté
    const isAdmin = (group.community.admins || []).some(
      (a) => a.user?.id === ctx.state.user.id
    );
    if (!isAdmin) {
      return ctx.forbidden('Seuls les administrateurs de la communauté peuvent inviter des participants.');
    }

    // 3. Trouver le profil admin de l'inviteur
    const adminProfiles = await strapi.documents(PROFILE_UID).findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const adminProfile = adminProfiles[0];
    if (!adminProfile) return ctx.badRequest('Profil communautaire introuvable.');

    // 4. Charger le profil invité avec son user
    const invitedProfile = await strapi.documents(PROFILE_UID).findOne({
      documentId: invitedProfileDocId,
      populate: { user: { fields: ['id'] } },
    });
    if (!invitedProfile || !invitedProfile.user) {
      return ctx.notFound('Profil invité introuvable.');
    }

    // 5. Vérifier que l'invité est un accompagné (target d'une companion-request acceptée)
    const acceptedRequests = await strapi.documents(REQUEST_UID).findMany({
      filters: {
        target: { id: invitedProfile.user.id },
        status: 'accepted',
      },
      limit: 1,
    });
    if (acceptedRequests.length === 0) {
      return ctx.forbidden('Seuls les accompagnés peuvent être invités à une réunion.');
    }

    // 6. Vérifier que l'invité est membre de la communauté
    const isMember = (group.community.members || []).some(
      (m) => m.user?.id === invitedProfile.user.id
    );
    if (!isMember) {
      return ctx.forbidden('L\'invité doit être membre de la communauté.');
    }

    // 7. Vérifier pas de doublon (pending ou registered)
    const existingRegs = await strapi.documents(UID).findMany({
      filters: {
        owner: { id: invitedProfile.user.id },
        communityGroup: { documentId: groupDocId },
        status: { $in: ['pending', 'registered', 'waitlisted'] },
      },
      limit: 1,
    });
    if (existingRegs.length > 0) {
      return ctx.badRequest('Cette personne a déjà une invitation ou inscription pour cette réunion.');
    }

    // 8. Créer l'invitation
    const entity = await strapi.documents(UID).create({
      data: {
        owner: invitedProfile.user.id,
        communityGroup: groupDocId,
        invitedBy: adminProfile.documentId,
        status: 'pending',
        registeredAt: new Date().toISOString(),
      },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // ── ACCEPT ── l'invité accepte l'invitation
  async accept(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const registration = await strapi.documents(UID).findOne({
      documentId,
      populate: {
        owner: { fields: ['id'] },
        communityGroup: { fields: ['documentId', 'maxMembers'] },
      },
    });

    if (!registration) return ctx.notFound();
    if (registration.owner?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez accepter que vos propres invitations.');
    }
    if (registration.status !== 'pending') {
      return ctx.badRequest('Cette invitation n\'est plus en attente.');
    }

    // Gestion de la capacité
    let status = 'registered';
    if (registration.communityGroup?.maxMembers) {
      const currentRegs = await strapi.documents(UID).findMany({
        filters: {
          communityGroup: { documentId: registration.communityGroup.documentId },
          status: 'registered',
        },
        fields: ['id'],
        limit: 10000,
      });
      if (currentRegs.length >= registration.communityGroup.maxMembers) {
        status = 'waitlisted';
      }
    }

    await strapi.documents(UID).update({
      documentId,
      data: { status },
    });

    return { data: { status } };
  },

  // ── REJECT ── l'invité rejette l'invitation
  async reject(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const registration = await strapi.documents(UID).findOne({
      documentId,
      populate: { owner: { fields: ['id'] } },
    });

    if (!registration) return ctx.notFound();
    if (registration.owner?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez refuser que vos propres invitations.');
    }
    if (registration.status !== 'pending') {
      return ctx.badRequest('Cette invitation n\'est plus en attente.');
    }

    await strapi.documents(UID).update({
      documentId,
      data: { status: 'rejected' },
    });

    return { data: { status: 'rejected' } };
  },

  // ── DELETE ── owner ou admin peut annuler
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const existing = await strapi.documents(UID).findOne({
      documentId,
      populate: { owner: { fields: ['id'] } },
    });
    if (!existing) return ctx.notFound();
    if (existing.owner?.id !== ctx.state.user.id) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const entity = await strapi.service(UID).delete(documentId, sanitizedQuery);
    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  // ── CREATE / UPDATE ── interdits (passage par invite/accept/reject)
  async create(ctx) {
    return ctx.forbidden('L\'inscription directe n\'est pas autorisée. Utilisez l\'invitation.');
  },
  async update(ctx) {
    return ctx.forbidden('La modification directe des inscriptions n\'est pas autorisée.');
  },
}));
