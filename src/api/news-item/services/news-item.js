'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::news-item.news-item');
