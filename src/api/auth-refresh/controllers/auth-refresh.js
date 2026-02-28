'use strict';

/**
 * Custom controller for refreshing JWT tokens.
 * Requires a valid (not yet expired) JWT. Issues a new token for the same user.
 */
module.exports = {
  async refresh(ctx) {
    // ctx.state.user is set by Strapi's JWT verification middleware
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('Token invalide ou expiré');
    }

    // Check the user is not blocked
    if (user.blocked) {
      return ctx.unauthorized('Compte bloqué');
    }

    // Issue a new JWT via Strapi's built-in JWT service
    const newToken = strapi.plugins['users-permissions'].services.jwt.issue({
      id: user.id,
    });

    ctx.body = {
      jwt: newToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        confirmed: user.confirmed,
        blocked: user.blocked,
      },
    };
  },
};
