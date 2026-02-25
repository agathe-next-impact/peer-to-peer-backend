'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/communities/:id/join',
      handler: 'community.join',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/communities/:id/leave',
      handler: 'community.leave',
      config: {
        policies: [],
      },
    },
  ],
};
