'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::news-item.news-item');
