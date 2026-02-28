'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/companion-bookmarks/:id/revoke',
      handler: 'companion-bookmark.revoke',
      config: {
        policies: [],
      },
    },
  ],
};
