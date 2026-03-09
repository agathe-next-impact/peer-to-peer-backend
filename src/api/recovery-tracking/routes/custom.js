'use strict';

/**
 * Routes custom pour le suivi du rétablissement.
 *
 * - GET  /api/recovery-trackings/dashboard  → bilan live (sans sauvegarde)
 * - POST /api/recovery-trackings/snapshot   → bilan sauvegardé en historique
 *
 * Les routes custom DOIVENT être déclarées avant les routes CRUD core
 * pour que Strapi les matche en priorité (le router core attrape /:id sinon).
 */
module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/recovery-trackings/dashboard',
      handler: 'recovery-tracking.dashboard',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/recovery-trackings/snapshot',
      handler: 'recovery-tracking.snapshot',
      config: {
        policies: [],
      },
    },
  ],
};
