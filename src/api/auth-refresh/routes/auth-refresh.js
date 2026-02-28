'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/refresh-token',
      handler: 'auth-refresh.refresh',
      config: {
        policies: [],
        // This route requires a valid JWT — Strapi will reject unauthenticated requests
      },
    },
  ],
};
