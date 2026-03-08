'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::encryption-key-store.encryption-key-store');
