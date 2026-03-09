'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const { createPrivateController } = require('../../_shared/private-controller');

/**
 * Controller pour le suivi du rétablissement.
 *
 * CRUD standard via createPrivateController (isolation owner + chiffrement).
 * Actions custom :
 *  - dashboard : bilan live agrégé sans sauvegarde
 *  - snapshot  : génère un bilan, le sauvegarde, et retourne le résultat
 */
const privateController = createPrivateController('api::recovery-tracking.recovery-tracking');

module.exports = createCoreController('api::recovery-tracking.recovery-tracking', ({ strapi }) => {
  // Récupérer les méthodes du private controller
  const privateMethods = typeof privateController === 'function'
    ? privateController({ strapi })
    : privateController;

  return {
    // Hériter des méthodes CRUD privées
    ...privateMethods,

    /**
     * GET /api/recovery-trackings/dashboard
     *
     * Retourne un bilan live agrégé de tous les outils de l'utilisateur,
     * avec les suggestions d'orientation, SANS sauvegarder en base.
     *
     * Query params optionnels :
     *  - since : ISO date pour limiter la période d'analyse
     *  - shared_by : userId pour accès compagnon (lecture)
     */
    async dashboard(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const sharedBy = ctx.query.shared_by;
      let targetUserId = ctx.state.user.id;

      if (sharedBy) {
        // Vérifier l'accès compagnon
        const accesses = await strapi.documents('api::companion-access.companion-access').findMany({
          filters: {
            owner: { id: Number(sharedBy) },
            companion: { id: ctx.state.user.id },
          },
          limit: 1,
        });
        if (accesses.length === 0) return ctx.forbidden('Accès compagnon non autorisé.');
        targetUserId = Number(sharedBy);
      }

      const aggregator = strapi.service('api::recovery-tracking.tracking-aggregator');
      const suggestionsEngine = strapi.service('api::recovery-tracking.suggestions-engine');

      const aggregation = await aggregator.aggregate(targetUserId, {
        since: ctx.query.since || null,
      });

      const suggestions = suggestionsEngine.generateSuggestions(aggregation);

      return {
        data: {
          ...aggregation,
          suggestions: suggestions.suggestions,
          orientation: suggestions.orientation,
          stageInfo: suggestions.stageInfo,
        },
      };
    },

    /**
     * POST /api/recovery-trackings/snapshot
     *
     * Génère un bilan complet, le sauvegarde en tant qu'entrée recovery-tracking,
     * et retourne le résultat. Permet de garder un historique des bilans.
     *
     * Body optionnel :
     *  - since : ISO date pour limiter la période d'analyse
     */
    async snapshot(ctx) {
      if (!ctx.state.user) return ctx.forbidden();

      const aggregator = strapi.service('api::recovery-tracking.tracking-aggregator');
      const suggestionsEngine = strapi.service('api::recovery-tracking.suggestions-engine');

      const since = ctx.request.body?.data?.since || null;
      const aggregation = await aggregator.aggregate(ctx.state.user.id, { since });
      const suggestions = suggestionsEngine.generateSuggestions(aggregation);

      // Sauvegarder le bilan
      const entity = await strapi.documents('api::recovery-tracking.recovery-tracking').create({
        data: {
          owner: ctx.state.user.id,
          date: aggregation.date,
          overallScore: aggregation.overallScore,
          recoveryStage: aggregation.recoveryStage,
          stabilityTrend: aggregation.stabilityTrend,
          moduleScores: aggregation.moduleScores,
          toolUsage: aggregation.toolUsage,
          evolution: aggregation.evolution,
          suggestions: {
            suggestions: suggestions.suggestions,
            orientation: suggestions.orientation,
            stageInfo: suggestions.stageInfo,
          },
        },
      });

      return {
        data: {
          id: entity.id,
          documentId: entity.documentId,
          ...aggregation,
          suggestions: suggestions.suggestions,
          orientation: suggestions.orientation,
          stageInfo: suggestions.stageInfo,
        },
      };
    },
  };
});
