'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::platform-settings.platform-settings');
