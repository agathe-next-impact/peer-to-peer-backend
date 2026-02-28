'use strict';

const { revokeToken } = require('../../../middlewares/token-blacklist');

module.exports = {
  async logout(ctx) {
    const authHeader = ctx.request.headers['authorization'];

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      revokeToken(token);
    }

    ctx.body = { ok: true };
  },
};
