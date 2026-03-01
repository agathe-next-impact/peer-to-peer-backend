'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::event-registration.event-registration';
const GROUP_UID = 'api::community-group.community-group';
const PROFILE_UID = 'api::community-profile.community-profile';
const REQUEST_UID = 'api::companion-request.companion-request';

module.exports = createCoreController(UID, ({ strapi }) => ({

  // ── FIND ── owner-scoped + vue admin/inviteur par communityGroup
  async find(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const sanitizedQuery = await this.sanitizeQuery(ctx);

    // Vue admin ou inviteur : inscriptions d'une réunion
    if (ctx.query.communityGroup && ctx.state.user) {
      const group = await strapi.documents(GROUP_UID).findOne({
        documentId: ctx.query.communityGroup,
        populate: {
          community: {
            populate: {
              admins: { populate: { user: { fields: ['id'] } } },
              members: { populate: { user: { fields: ['id'] } } },
            },
          },
        },
      });
      if (group) {
        const isAdmin = (group.community?.admins || []).some(
          (a) => a.user?.id === ctx.state.user.id
        );

        if (isAdmin) {
          // Admin voit toutes les inscriptions de la réunion
          return await this._findRegistrationsWithPseudonyms(ctx, {
            communityGroup: { documentId: ctx.query.communityGroup },
          });
        }

        // Vue inviteur : l'accompagnant voit les inscriptions qu'il a envoyées
        const inviterProfiles = await strapi.documents(PROFILE_UID).findMany({
          filters: { user: { id: ctx.state.user.id } },
          limit: 1,
        });
        const inviterProfile = inviterProfiles[0];
        if (inviterProfile) {
          return await this._findRegistrationsWithPseudonyms(ctx, {
            communityGroup: { documentId: ctx.query.communityGroup },
            invitedBy: { documentId: inviterProfile.documentId },
          });
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

  // Helper : charge les inscriptions avec pseudonymes des owners
  async _findRegistrationsWithPseudonyms(_ctx, filters) {
    const results = await strapi.documents(UID).findMany({
      filters,
      populate: {
        owner: { fields: ['id'] },
        invitedBy: { fields: ['pseudonym', 'documentId'] },
        communityGroup: { fields: ['documentId'] },
      },
      limit: 100,
    });

    // Lookup pseudonymes via community-profile
    const ownerIds = [...new Set(results.map((r) => r.owner?.id).filter(Boolean))];
    const userIdToPseudo = {};
    if (ownerIds.length > 0) {
      const profiles = await strapi.documents(PROFILE_UID).findMany({
        filters: { user: { id: { $in: ownerIds } } },
        populate: { user: { fields: ['id'] } },
      });
      for (const p of profiles) {
        if (p.user?.id) userIdToPseudo[p.user.id] = p.pseudonym;
      }
    }

    const enriched = results.map((r) => ({
      ...r,
      ownerPseudonym: r.owner?.id ? userIdToPseudo[r.owner.id] || null : null,
    }));

    return this.transformResponse(enriched, {
      pagination: { page: 1, pageSize: enriched.length, pageCount: 1, total: enriched.length },
    });
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

  // ── INVITE ── un accompagnant invite un membre de sa communauté
  async invite(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const body = ctx.request.body?.data || ctx.request.body || {};
    const { communityGroup: groupDocId, invitedProfile: invitedProfileDocId } = body;

    if (!groupDocId || !invitedProfileDocId) {
      return ctx.badRequest('Les champs communityGroup et invitedProfile sont requis.');
    }

    // 1. Charger le group avec sa community → members
    const group = await strapi.documents(GROUP_UID).findOne({
      documentId: groupDocId,
      populate: {
        community: {
          populate: {
            members: { populate: { user: { fields: ['id'] } } },
          },
        },
      },
    });

    if (!group) return ctx.notFound('Réunion introuvable.');
    if (!group.community) return ctx.badRequest('Cette réunion n\'est rattachée à aucune communauté.');
    if (group.status !== 'active') return ctx.badRequest('Cette réunion n\'est pas active.');

    // 2. Vérifier que l'inviteur est membre de la communauté
    const inviterIsMember = (group.community.members || []).some(
      (m) => m.user?.id === ctx.state.user.id
    );
    if (!inviterIsMember) {
      return ctx.forbidden('Vous devez être membre de la communauté pour inviter des participants.');
    }

    // 3. Vérifier que l'inviteur est un accompagnant
    //    (requester d'au moins une companion-request acceptée)
    const isAccompagnant = await strapi.documents(REQUEST_UID).findMany({
      filters: {
        requester: { id: ctx.state.user.id },
        status: 'accepted',
      },
      limit: 1,
    });
    if (isAccompagnant.length === 0) {
      return ctx.forbidden('Seuls les accompagnants peuvent inviter des participants à une réunion.');
    }

    // 4. Trouver le profil communautaire de l'inviteur
    const inviterProfiles = await strapi.documents(PROFILE_UID).findMany({
      filters: { user: { id: ctx.state.user.id } },
      limit: 1,
    });
    const inviterProfile = inviterProfiles[0];
    if (!inviterProfile) return ctx.badRequest('Profil communautaire introuvable.');

    // 5. Charger le profil invité avec son user
    const invitedProfile = await strapi.documents(PROFILE_UID).findOne({
      documentId: invitedProfileDocId,
      populate: { user: { fields: ['id'] } },
    });
    if (!invitedProfile || !invitedProfile.user) {
      return ctx.notFound('Profil invité introuvable.');
    }

    // 6. Empêcher l'auto-invitation
    if (invitedProfile.user.id === ctx.state.user.id) {
      return ctx.badRequest('Vous ne pouvez pas vous inviter vous-même.');
    }

    // 7. Vérifier que l'invité est membre de la communauté
    const isMember = (group.community.members || []).some(
      (m) => m.user?.id === invitedProfile.user.id
    );
    if (!isMember) {
      return ctx.forbidden('L\'invité doit être membre de la communauté.');
    }

    // 8. Vérifier pas de doublon (pending ou registered)
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

    // 9. Créer l'invitation
    const entity = await strapi.documents(UID).create({
      data: {
        owner: invitedProfile.user.id,
        communityGroup: groupDocId,
        invitedBy: inviterProfile.documentId,
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

  // ── REVOKE ── l'inviteur ou l'admin peut révoquer une invitation
  async revoke(ctx) {
    if (!ctx.state.user) return ctx.forbidden();
    const { id: documentId } = ctx.params;

    const registration = await strapi.documents(UID).findOne({
      documentId,
      populate: {
        owner: { fields: ['id'] },
        invitedBy: { fields: ['documentId'] },
        communityGroup: {
          populate: {
            community: {
              populate: {
                admins: { populate: { user: { fields: ['id'] } } },
              },
            },
          },
        },
      },
    });

    if (!registration) return ctx.notFound();

    // Vérifier que le statut permet la révocation
    if (!['pending', 'registered', 'waitlisted'].includes(registration.status)) {
      return ctx.badRequest('Cette inscription ne peut pas être révoquée.');
    }

    // Vérifier que l'utilisateur est admin ou l'inviteur
    const isAdmin = (registration.communityGroup?.community?.admins || []).some(
      (a) => a.user?.id === ctx.state.user.id
    );

    let isInviter = false;
    if (registration.invitedBy?.documentId) {
      const inviterProfiles = await strapi.documents(PROFILE_UID).findMany({
        filters: { user: { id: ctx.state.user.id } },
        limit: 1,
      });
      isInviter = inviterProfiles[0]?.documentId === registration.invitedBy.documentId;
    }

    if (!isAdmin && !isInviter) {
      return ctx.forbidden('Seuls l\'inviteur ou un administrateur peuvent révoquer une invitation.');
    }

    await strapi.documents(UID).update({
      documentId,
      data: { status: 'cancelled' },
    });

    return { data: { status: 'cancelled' } };
  },

  // ── CREATE / UPDATE ── interdits (passage par invite/accept/reject)
  async create(ctx) {
    return ctx.forbidden('L\'inscription directe n\'est pas autorisée. Utilisez l\'invitation.');
  },
  async update(ctx) {
    return ctx.forbidden('La modification directe des inscriptions n\'est pas autorisée.');
  },
}));
