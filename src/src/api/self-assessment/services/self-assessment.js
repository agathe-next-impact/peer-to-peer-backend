'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::self-assessment.self-assessment');
