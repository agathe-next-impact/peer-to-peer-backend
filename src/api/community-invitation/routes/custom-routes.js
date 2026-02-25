'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/community-invitations/invite',
      handler: 'community-invitation.invite',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/community-invitations/:id/accept',
      handler: 'community-invitation.accept',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/community-invitations/:id/reject',
      handler: 'community-invitation.reject',
      config: {
        policies: [],
      },
    },
  ],
};
