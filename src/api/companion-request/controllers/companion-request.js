'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::companion-request.companion-request';
const BOOKMARK_UID = 'api::companion-bookmark.companion-bookmark';
const PROFILE_UID = 'api::community-profile.community-profile';

module.exports = createCoreController(UID, ({ strapi }) => ({

  /**
   * Envoyer une demande de compagnonnage par email.
   * Retourne toujours { sent: true } pour ne pas révéler l'existence d'un email.
   */
  async send(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const body = ctx.request.body;
    const data = body.data || body;
    const { email, message } = data;

    if (!email || typeof email !== 'string') {
      return ctx.badRequest('L\'adresse email est requise.');
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Empêcher l'auto-demande
    if (trimmedEmail === ctx.state.user.email?.toLowerCase()) {
      return ctx.badRequest('Vous ne pouvez pas vous envoyer une demande à vous-même.');
    }

    // Chercher le user par email
    const targetUser = await strapi.db
      .query('plugin::users-permissions.user')
      .findOne({ where: { email: trimmedEmail } });

    // Si user non trouvé → retourner succès quand même (message neutre)
    if (!targetUser) {
      return { sent: true };
    }

    // Vérifier pas de demande pending existante (dans les 2 sens)
    const existingRequests = await strapi.documents(UID).findMany({
      filters: {
        $or: [
          { requester: { id: ctx.state.user.id }, target: { id: targetUser.id } },
          { requester: { id: targetUser.id }, target: { id: ctx.state.user.id } },
        ],
        status: 'pending',
      },
      limit: 1,
    });

    if (existingRequests.length > 0) {
      return { sent: true, alreadyPending: true };
    }

    // Vérifier pas déjà compagnons (via CompanionBookmark)
    const existingBookmarks = await strapi.documents(BOOKMARK_UID).findMany({
      filters: { owner: { id: ctx.state.user.id } },
      populate: { companion: { populate: { user: { fields: ['id'] } } } },
    });

    const isAlreadyCompanion = existingBookmarks.some(
      (b) => b.companion?.user?.id === targetUser.id
    );

    if (isAlreadyCompanion) {
      return { sent: true, alreadyCompanion: true };
    }

    // Créer la demande
    await strapi.documents(UID).create({
      data: {
        requester: ctx.state.user.id,
        target: targetUser.id,
        status: 'pending',
        message: message?.trim() || null,
      },
    });

    // Envoyer email de notification
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      await strapi.plugin('email').service('email').send({
        to: targetUser.email,
        subject: 'Nouvelle demande de compagnonnage — Pairemancipation',
        text: `Bonjour ${targetUser.username},\n\n${ctx.state.user.username} souhaite devenir votre compagnon sur Pairemancipation.\n\n${message ? `Message : "${message.trim()}"\n\n` : ''}Connectez-vous pour accepter ou refuser cette demande :\n${siteUrl}/communaute/mes-compagnons\n\nCordialement,\nL'équipe Pairemancipation`,
        html: `
          <p>Bonjour <strong>${targetUser.username}</strong>,</p>
          <p><strong>${ctx.state.user.username}</strong> souhaite devenir votre compagnon sur Pairemancipation.</p>
          ${message ? `<blockquote style="border-left:3px solid #ccc;padding-left:12px;color:#555;">${message.trim()}</blockquote>` : ''}
          <p><a href="${siteUrl}/communaute/mes-compagnons">Connectez-vous pour accepter ou refuser cette demande</a></p>
          <p>Cordialement,<br/>L'équipe Pairemancipation</p>
        `,
      });
    } catch (err) {
      strapi.log.warn('Failed to send companion request email:', err.message);
    }

    return { sent: true };
  },

  /**
   * Demandes reçues (pending) par l'utilisateur connecté.
   */
  async findReceived(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const entries = await strapi.documents(UID).findMany({
      filters: {
        target: { id: ctx.state.user.id },
        status: 'pending',
      },
      populate: { requester: { fields: ['id', 'username', 'email'] } },
      sort: { createdAt: 'desc' },
    });

    const sanitizedResults = await this.sanitizeOutput(entries, ctx);

    // Ré-injecter requester après sanitisation (strippé par sanitizeOutput)
    for (let i = 0; i < sanitizedResults.length; i++) {
      if (entries[i]?.requester) {
        sanitizedResults[i].requester = {
          id: entries[i].requester.id,
          username: entries[i].requester.username,
          email: entries[i].requester.email,
        };
      }
    }

    return this.transformResponse(sanitizedResults);
  },

  /**
   * Demandes envoyées par l'utilisateur connecté (tous statuts).
   */
  async findSent(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const entries = await strapi.documents(UID).findMany({
      filters: {
        requester: { id: ctx.state.user.id },
      },
      populate: { target: { fields: ['id', 'username', 'email'] } },
      sort: { createdAt: 'desc' },
    });

    const sanitizedResults = await this.sanitizeOutput(entries, ctx);

    // Ré-injecter target après sanitisation
    for (let i = 0; i < sanitizedResults.length; i++) {
      if (entries[i]?.target) {
        sanitizedResults[i].target = {
          id: entries[i].target.id,
          username: entries[i].target.username,
          email: entries[i].target.email,
        };
      }
    }

    return this.transformResponse(sanitizedResults);
  },

  /**
   * Accepter une demande → crée les CompanionBookmarks mutuels.
   */
  async accept(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { id: documentId } = ctx.params;

    const request = await strapi.documents(UID).findOne({
      documentId,
      populate: {
        target: { fields: ['id', 'username', 'email'] },
        requester: { fields: ['id', 'username', 'email'] },
      },
    });

    if (!request) return ctx.notFound();
    if (request.target?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez accepter que les demandes qui vous sont adressées.');
    }
    if (request.status !== 'pending') {
      return ctx.badRequest('Cette demande n\'est plus en attente.');
    }

    // Mettre à jour le statut
    await strapi.documents(UID).update({
      documentId,
      data: { status: 'accepted' },
    });

    // Chercher ou créer les community-profiles des deux utilisateurs
    const requesterProfile = await findOrCreateProfile(strapi, request.requester);
    const targetProfile = await findOrCreateProfile(strapi, request.target);

    if (requesterProfile && targetProfile) {
      // Créer CompanionBookmark : requester → target
      const existingBk1 = await strapi.documents(BOOKMARK_UID).findMany({
        filters: { owner: { id: request.requester.id } },
        populate: { companion: { populate: { user: { fields: ['id'] } } } },
      });
      const alreadyBookmarked1 = existingBk1.some(
        (b) => b.companion?.user?.id === request.target.id
      );
      if (!alreadyBookmarked1) {
        await strapi.documents(BOOKMARK_UID).create({
          data: {
            owner: request.requester.id,
            companion: targetProfile.documentId,
            addedAt: new Date().toISOString(),
          },
        });
      }

      // Créer CompanionBookmark : target → requester
      const existingBk2 = await strapi.documents(BOOKMARK_UID).findMany({
        filters: { owner: { id: request.target.id } },
        populate: { companion: { populate: { user: { fields: ['id'] } } } },
      });
      const alreadyBookmarked2 = existingBk2.some(
        (b) => b.companion?.user?.id === request.requester.id
      );
      if (!alreadyBookmarked2) {
        await strapi.documents(BOOKMARK_UID).create({
          data: {
            owner: request.target.id,
            companion: requesterProfile.documentId,
            addedAt: new Date().toISOString(),
          },
        });
      }
    }

    // Envoyer email de confirmation au requester
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    try {
      await strapi.plugin('email').service('email').send({
        to: request.requester.email,
        subject: 'Demande de compagnonnage acceptée — Pairemancipation',
        text: `Bonjour ${request.requester.username},\n\n${request.target.username} a accepté votre demande de compagnonnage.\n\nVous pouvez maintenant gérer vos droits d'accès mutuels :\n${siteUrl}/communaute/mes-compagnons\n\nCordialement,\nL'équipe Pairemancipation`,
        html: `
          <p>Bonjour <strong>${request.requester.username}</strong>,</p>
          <p><strong>${request.target.username}</strong> a accepté votre demande de compagnonnage.</p>
          <p><a href="${siteUrl}/communaute/mes-compagnons">Gérer vos droits d'accès mutuels</a></p>
          <p>Cordialement,<br/>L'équipe Pairemancipation</p>
        `,
      });
    } catch (err) {
      strapi.log.warn('Failed to send acceptance email:', err.message);
    }

    return { data: { status: 'accepted' } };
  },

  /**
   * Refuser une demande.
   */
  async reject(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { id: documentId } = ctx.params;

    const request = await strapi.documents(UID).findOne({
      documentId,
      populate: { target: { fields: ['id'] } },
    });

    if (!request) return ctx.notFound();
    if (request.target?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez refuser que les demandes qui vous sont adressées.');
    }
    if (request.status !== 'pending') {
      return ctx.badRequest('Cette demande n\'est plus en attente.');
    }

    await strapi.documents(UID).update({
      documentId,
      data: { status: 'rejected' },
    });

    return { data: { status: 'rejected' } };
  },

  /**
   * Annuler une demande envoyée.
   */
  async cancel(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { id: documentId } = ctx.params;

    const request = await strapi.documents(UID).findOne({
      documentId,
      populate: { requester: { fields: ['id'] } },
    });

    if (!request) return ctx.notFound();
    if (request.requester?.id !== ctx.state.user.id) {
      return ctx.forbidden('Vous ne pouvez annuler que vos propres demandes.');
    }
    if (request.status !== 'pending') {
      return ctx.badRequest('Cette demande n\'est plus en attente.');
    }

    await strapi.documents(UID).update({
      documentId,
      data: { status: 'cancelled' },
    });

    return { data: { status: 'cancelled' } };
  },
}));

/**
 * Cherche le community-profile d'un user. En crée un minimal s'il n'existe pas.
 */
async function findOrCreateProfile(strapi, user) {
  if (!user?.id) return null;

  const existing = await strapi.documents(PROFILE_UID).findMany({
    filters: { user: { id: user.id } },
    limit: 1,
  });

  if (existing.length > 0) return existing[0];

  // Créer un profil minimal
  const created = await strapi.documents(PROFILE_UID).create({
    data: {
      user: user.id,
      pseudonym: user.username || `Membre ${user.id}`,
      isVisible: false,
      joinedAt: new Date().toISOString().split('T')[0],
    },
  });

  return created;
}
