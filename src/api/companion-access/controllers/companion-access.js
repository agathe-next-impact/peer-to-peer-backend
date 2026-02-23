'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

const UID = 'api::companion-access.companion-access';

module.exports = createCoreController(UID, ({ strapi }) => ({

  /**
   * Liste les accès accordés PAR l'utilisateur connecté (owner = moi).
   * Filtre optionnel par companion via query param.
   */
  async find(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const sanitizedQuery = await this.sanitizeQuery(ctx);
    sanitizedQuery.filters = {
      ...(sanitizedQuery.filters || {}),
      owner: { id: ctx.state.user.id },
    };
    sanitizedQuery.populate = { companion: { fields: ['id', 'username', 'email'] } };

    const { results, pagination } = await strapi.service(UID).find(sanitizedQuery);
    const sanitizedResults = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitizedResults, { pagination });
  },

  /**
   * Liste les accès accordés À l'utilisateur connecté (companion = moi).
   */
  async findGrantedToMe(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const entries = await strapi.documents(UID).findMany({
      filters: { companion: { id: ctx.state.user.id } },
      populate: { owner: { fields: ['id', 'username', 'email'] } },
    });

    const sanitizedResults = await this.sanitizeOutput(entries, ctx);
    return this.transformResponse(sanitizedResults);
  },

  /**
   * Créer un accès. Seul l'owner peut accorder.
   * Vérifie que le companion est dans les bookmarks de l'owner.
   */
  async create(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const body = ctx.request.body;
    const data = body.data || body;
    const { companion: companionUserId, section, permission } = data;

    if (!companionUserId || !section) {
      return ctx.badRequest('companion et section sont requis.');
    }

    // Vérifier que le companion est bookmarké par l'owner
    // companion-bookmark.companion pointe vers community-profile, qui a un user
    const bookmarks = await strapi.documents('api::companion-bookmark.companion-bookmark').findMany({
      filters: { owner: { id: ctx.state.user.id } },
      populate: { companion: { populate: { user: { fields: ['id'] } } } },
    });

    const isBookmarked = bookmarks.some(
      (b) => b.companion?.user?.id === Number(companionUserId)
    );
    if (!isBookmarked) {
      return ctx.badRequest('Ce membre n\'est pas dans vos compagnons.');
    }

    // Vérifier qu'un accès n'existe pas déjà pour cette section
    const existing = await strapi.documents(UID).findMany({
      filters: {
        owner: { id: ctx.state.user.id },
        companion: { id: companionUserId },
        section,
      },
      limit: 1,
    });

    if (existing.length > 0) {
      // Mettre à jour l'existant au lieu de créer un doublon
      const updated = await strapi.documents(UID).update({
        documentId: existing[0].documentId,
        data: { permission: permission || 'read' },
      });
      const sanitized = await this.sanitizeOutput(updated, ctx);
      return this.transformResponse(sanitized);
    }

    const entity = await strapi.documents(UID).create({
      data: {
        owner: ctx.state.user.id,
        companion: companionUserId,
        section,
        permission: permission || 'read',
      },
    });

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  /**
   * Modifier la permission d'un accès existant. Seul l'owner peut modifier.
   */
  async update(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { id: documentId } = ctx.params;

    const existing = await strapi.documents(UID).findOne({
      documentId,
      populate: { owner: { fields: ['id'] } },
    });
    if (!existing || existing.owner?.id !== ctx.state.user.id) {
      return ctx.forbidden();
    }

    const body = ctx.request.body;
    const data = body.data || body;

    const entity = await strapi.documents(UID).update({
      documentId,
      data: { permission: data.permission },
    });

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  /**
   * Révoquer un accès. Seul l'owner peut supprimer.
   */
  async delete(ctx) {
    if (!ctx.state.user) return ctx.forbidden();

    const { id: documentId } = ctx.params;

    const existing = await strapi.documents(UID).findOne({
      documentId,
      populate: { owner: { fields: ['id'] } },
    });
    if (!existing || existing.owner?.id !== ctx.state.user.id) {
      return ctx.forbidden();
    }

    await strapi.documents(UID).delete({ documentId });
    return { data: null };
  },
}));
