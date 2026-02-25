'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::community-invitation.community-invitation', ({ strapi }) => ({

  /**
   * find — si ?mine=true, retourne les invitations de l'utilisateur courant.
   * Si ?community=<documentId>, retourne les invitations de cette communauté.
   */
  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    if (ctx.query.mine === 'true' && ctx.state.user) {
      // Find the user's community profile
      const profiles = await strapi.documents('api::community-profile.community-profile').findMany({
        filters: { user: { id: ctx.state.user.id } },
        limit: 1,
      });
      if (!profiles[0]) {
        return this.transformResponse([]);
      }
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        invitedProfile: { documentId: profiles[0].documentId },
        status: 'pending',
      };
    } else if (ctx.query.community && ctx.state.user) {
      sanitizedQuery.filters = {
        ...(sanitizedQuery.filters || {}),
        community: { documentId: ctx.query.community },
      };
    }

    const { results, pagination } = await strapi
      .service('api::community-invitation.community-invitation')
      .find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  /**
   * invite — un admin de communauté invite un profil.
   * Body: { data: { community: documentId, invitedProfile: documentId, message?: string } }
   */
  async invite(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { community: communityDocId, invitedProfile: invitedProfileDocId, message } =
      ctx.request.body?.data || ctx.request.body || {};

    if (!communityDocId || !invitedProfileDocId) {
      return ctx.badRequest('Les champs community et invitedProfile sont requis.');
    }

    // Find the inviter's profile
    const inviterProfiles = await strapi.documents('api::community-profile.community-profile').findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const inviterProfile = inviterProfiles[0];
    if (!inviterProfile) {
      return ctx.badRequest('Vous devez créer un profil communautaire.');
    }

    // Check inviter is admin of the community
    const community = await strapi.documents('api::community.community').findOne({
      documentId: communityDocId,
      populate: {
        admins: { populate: { user: { fields: ['id'] } } },
        members: { fields: ['documentId'] },
      },
    });
    if (!community) return ctx.notFound('Communauté introuvable.');

    const isAdmin = (community.admins || []).some((a) => a.user?.id === ctx.state.user.id);
    if (!isAdmin) {
      return ctx.forbidden('Seuls les administrateurs peuvent inviter des membres.');
    }

    // Check invited profile exists
    const invitedProfile = await strapi.documents('api::community-profile.community-profile').findOne({
      documentId: invitedProfileDocId,
    });
    if (!invitedProfile) {
      return ctx.notFound('Profil invité introuvable.');
    }

    // Check invited profile is not already a member
    const alreadyMember = (community.members || []).some((m) => m.documentId === invitedProfileDocId);
    if (alreadyMember) {
      return ctx.badRequest('Cette personne est déjà membre de la communauté.');
    }

    // Check no pending invitation exists
    const existingInvitations = await strapi.documents('api::community-invitation.community-invitation').findMany({
      filters: {
        community: { documentId: communityDocId },
        invitedProfile: { documentId: invitedProfileDocId },
        status: 'pending',
      },
      limit: 1,
    });
    if (existingInvitations.length > 0) {
      return ctx.badRequest('Une invitation est déjà en attente pour cette personne.');
    }

    // Create the invitation
    const entity = await strapi.documents('api::community-invitation.community-invitation').create({
      data: {
        community: communityDocId,
        invitedProfile: invitedProfileDocId,
        invitedBy: inviterProfile.documentId,
        status: 'pending',
        message: message || null,
      },
      populate: {
        community: { fields: ['name', 'slug'] },
        invitedProfile: { fields: ['pseudonym'] },
        invitedBy: { fields: ['pseudonym'] },
      },
    });

    const sanitizedEntity = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitizedEntity);
  },

  /**
   * accept — l'invité accepte l'invitation et est ajouté aux membres.
   */
  async accept(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const invitation = await strapi.documents('api::community-invitation.community-invitation').findOne({
      documentId,
      populate: {
        invitedProfile: { populate: { user: { fields: ['id'] } } },
        community: { populate: { members: { fields: ['documentId'] } } },
      },
    });
    if (!invitation) return ctx.notFound('Invitation introuvable.');
    if (invitation.status !== 'pending') {
      return ctx.badRequest('Cette invitation a déjà été traitée.');
    }

    // Verify the current user is the invited person
    if (invitation.invitedProfile?.user?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez accepter que vos propres invitations.');
    }

    // Update invitation status
    await strapi.documents('api::community-invitation.community-invitation').update({
      documentId,
      data: { status: 'accepted' },
    });

    // Add the invited profile to community members
    const community = invitation.community;
    if (community) {
      const memberIds = (community.members || []).map((m) => m.documentId);
      if (!memberIds.includes(invitation.invitedProfile.documentId)) {
        memberIds.push(invitation.invitedProfile.documentId);
        await strapi.documents('api::community.community').update({
          documentId: community.documentId,
          data: { members: memberIds },
        });
      }
    }

    return { data: { status: 'accepted' } };
  },

  /**
   * reject — l'invité rejette l'invitation.
   */
  async reject(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const invitation = await strapi.documents('api::community-invitation.community-invitation').findOne({
      documentId,
      populate: {
        invitedProfile: { populate: { user: { fields: ['id'] } } },
      },
    });
    if (!invitation) return ctx.notFound('Invitation introuvable.');
    if (invitation.status !== 'pending') {
      return ctx.badRequest('Cette invitation a déjà été traitée.');
    }

    // Verify the current user is the invited person
    if (invitation.invitedProfile?.user?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez refuser que vos propres invitations.');
    }

    await strapi.documents('api::community-invitation.community-invitation').update({
      documentId,
      data: { status: 'rejected' },
    });

    return { data: { status: 'rejected' } };
  },
}));
