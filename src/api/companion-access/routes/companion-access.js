'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/companion-accesses',
      handler: 'companion-access.find',
    },
    {
      method: 'GET',
      path: '/companion-accesses/granted',
      handler: 'companion-access.findGrantedToMe',
    },
    {
      method: 'POST',
      path: '/companion-accesses',
      handler: 'companion-access.create',
    },
    {
      method: 'PUT',
      path: '/companion-accesses/:id',
      handler: 'companion-access.update',
    },
    {
      method: 'DELETE',
      path: '/companion-accesses/:id',
      handler: 'companion-access.delete',
    },
  ],
};
