'use strict';

/**
 * ============================================================================
 * OWNER POLICY — Restriction d'accès aux données personnelles
 * ============================================================================
 *
 * Cette policy s'assure qu'un utilisateur authentifié ne peut accéder
 * qu'à ses propres données dans la zone privée.
 *
 * Usage dans les routes :
 *   config: { policies: ['global::is-owner'] }
 */

module.exports = async (policyContext, config, { strapi }) => {
  const { state, params } = policyContext;

  // L'utilisateur doit être authentifié
  if (!state.user) {
    return false;
  }

  // Pour les requêtes find/findOne, on filtre par owner
  if (policyContext.request.method === 'GET') {
    // Ajouter un filtre owner automatiquement (syntaxe Strapi v5 pour les relations)
    if (!policyContext.request.query.filters) {
      policyContext.request.query.filters = {};
    }
    policyContext.request.query.filters.owner = { id: { $eq: state.user.id } };
    return true;
  }

  // Pour create, on force le owner
  if (policyContext.request.method === 'POST') {
    if (policyContext.request.body?.data) {
      policyContext.request.body.data.owner = state.user.id;
    }
    return true;
  }

  // Pour update/delete, vérifier que l'entrée appartient à l'utilisateur
  if (['PUT', 'DELETE'].includes(policyContext.request.method) && params.id) {
    const contentType = policyContext.state.route?.info?.apiName;
    if (!contentType) return false;

    const uid = `api::${contentType}.${contentType}`;

    // Strapi v5 : params.id est un documentId (string)
    const entry = await strapi.documents(uid).findOne({
      documentId: params.id,
      fields: ['id'],
      populate: { owner: { fields: ['id'] } },
    });
    if (!entry || entry.owner?.id !== state.user.id) {
      return false;
    }
    return true;
  }

  return false;
};
