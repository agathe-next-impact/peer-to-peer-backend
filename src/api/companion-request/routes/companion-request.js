'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/companion-requests/send',
      handler: 'companion-request.send',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/companion-requests/received',
      handler: 'companion-request.findReceived',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/companion-requests/sent',
      handler: 'companion-request.findSent',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/companion-requests/:id/accept',
      handler: 'companion-request.accept',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/companion-requests/:id/reject',
      handler: 'companion-request.reject',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/companion-requests/:id/cancel',
      handler: 'companion-request.cancel',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
