'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/auth/logout',
      handler: 'auth-logout.logout',
      config: {
        policies: [],
      },
    },
  ],
};
