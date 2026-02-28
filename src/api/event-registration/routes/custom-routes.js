'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/event-registrations/invite',
      handler: 'event-registration.invite',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/event-registrations/:id/accept',
      handler: 'event-registration.accept',
      config: {
        policies: [],
      },
    },
    {
      method: 'POST',
      path: '/event-registrations/:id/reject',
      handler: 'event-registration.reject',
      config: {
        policies: [],
      },
    },
  ],
};
