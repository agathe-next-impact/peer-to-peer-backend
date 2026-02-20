'use strict';

const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');

module.exports = {
  /**
   * Appelé au démarrage de Strapi.
   */
  async bootstrap({ strapi }) {
    // Enregistrer le middleware de chiffrement pour la zone privée
    registerEncryptionLifecycles(strapi);

    strapi.log.info('[Bootstrap] Chiffrement des données de santé activé');
  },

  /**
   * Appelé lors de l'enregistrement des middlewares/plugins.
   */
  register({ strapi }) {
    // Possibilité d'ajouter des middlewares personnalisés ici
  },
};
