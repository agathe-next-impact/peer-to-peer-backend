import type { Core } from '@strapi/strapi';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Register encryption lifecycles for private content-types
    registerEncryptionLifecycles(strapi);

    // Configure public permissions for the frontend
    await configurePublicPermissions(strapi);
    // Configure authenticated permissions for private content
    await configureAuthenticatedPermissions(strapi);
  },
};

async function configurePublicPermissions(strapi: Core.Strapi) {
  const publicRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) return;

  // Content-types that should be publicly readable (find + findOne)
  const publicContentTypes = [
    'api::blog-article.blog-article',
    'api::blog-category.blog-category',
    'api::tag.tag',
    'api::event.event',
    'api::news-item.news-item',
    'api::structure.structure',
    'api::service-type.service-type',
    'api::knowledge-category.knowledge-category',
    'api::knowledge-base-entry.knowledge-base-entry',
    'api::tutorial.tutorial',
    'api::assessment-template.assessment-template',
    'api::about-page.about-page',
    'api::homepage.homepage',
    'api::community-profile.community-profile',
    'api::community-group.community-group',
    'api::community.community',
  ];

  for (const uid of publicContentTypes) {
    for (const action of ['find', 'findOne']) {
      const permission = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            role: publicRole.id,
            action: `${uid}.${action}`,
          },
        });

      if (!permission) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({
            data: {
              role: publicRole.id,
              action: `${uid}.${action}`,
              enabled: true,
            },
          });
      } else if (!permission.enabled) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .update({
            where: { id: permission.id },
            data: { enabled: true },
          });
      }
    }
  }

  // Ensure auth endpoints are enabled for Public role
  const authActions = [
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.register',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.resetPassword',
  ];

  for (const action of authActions) {
    const permission = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({
        where: { role: publicRole.id, action },
      });

    if (!permission) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({
          data: { role: publicRole.id, action, enabled: true },
        });
    } else if (!permission.enabled) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .update({
          where: { id: permission.id },
          data: { enabled: true },
        });
    }
  }

  strapi.log.info('Public API permissions configured (including auth)');
}

async function configureAuthenticatedPermissions(strapi: Core.Strapi) {
  const authenticatedRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  if (!authenticatedRole) return;

  // Private content-types: full CRUD for authenticated users
  const privateContentTypes = [
    'api::personal-notebook.personal-notebook',
    'api::personal-goal.personal-goal',
    'api::self-assessment.self-assessment',
    'api::personal-calendar-event.personal-calendar-event',
    'api::recovery-profile.recovery-profile',
    'api::generated-document.generated-document',
    'api::recovery-recommendation.recovery-recommendation',
    'api::situation-observation.situation-observation',
    'api::situation-thesaurus.situation-thesaurus',
    'api::situation-objective.situation-objective',
    'api::self-problem-solving.self-problem-solving',
    'api::early-warning-sign.early-warning-sign',
    'api::companion-bookmark.companion-bookmark',
    'api::companion-access.companion-access',
    'api::event-registration.event-registration',
    'api::community-profile.community-profile',
    'api::community-group.community-group',
    'api::community.community',
    'api::community-invitation.community-invitation',
    'api::wellness-checkin.wellness-checkin',
    'api::wellness-tracker-config.wellness-tracker-config',
    'api::companion-request.companion-request',
  ];

  const crudActions = ['find', 'findOne', 'create', 'update', 'delete'];

  for (const uid of privateContentTypes) {
    for (const action of crudActions) {
      const permission = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            role: authenticatedRole.id,
            action: `${uid}.${action}`,
          },
        });

      if (!permission) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({
            data: {
              role: authenticatedRole.id,
              action: `${uid}.${action}`,
              enabled: true,
            },
          });
      } else if (!permission.enabled) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .update({
            where: { id: permission.id },
            data: { enabled: true },
          });
      }
    }
  }

  // Custom actions (including token refresh)
  const customActions = [
    'api::auth-refresh.auth-refresh.refresh',
    'api::auth-logout.auth-logout.logout',
    'api::companion-access.companion-access.findGrantedToMe',
    'api::community.community.join',
    'api::community.community.leave',
    'api::community-invitation.community-invitation.invite',
    'api::community-invitation.community-invitation.accept',
    'api::community-invitation.community-invitation.reject',
    'api::companion-request.companion-request.send',
    'api::companion-request.companion-request.findReceived',
    'api::companion-request.companion-request.findSent',
    'api::companion-request.companion-request.accept',
    'api::companion-request.companion-request.reject',
    'api::companion-request.companion-request.cancel',
    'api::companion-bookmark.companion-bookmark.revoke',
    'api::event-registration.event-registration.invite',
    'api::event-registration.event-registration.accept',
    'api::event-registration.event-registration.reject',
    'api::event-registration.event-registration.revoke',
  ];
  for (const action of customActions) {
    const permission = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({
        where: { role: authenticatedRole.id, action },
      });
    if (!permission) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .create({
          data: { role: authenticatedRole.id, action, enabled: true },
        });
    } else if (!permission.enabled) {
      await strapi.db
        .query('plugin::users-permissions.permission')
        .update({
          where: { id: permission.id },
          data: { enabled: true },
        });
    }
  }

  // Authenticated users should also read public content
  const publicContentTypes = [
    'api::blog-article.blog-article',
    'api::blog-category.blog-category',
    'api::tag.tag',
    'api::event.event',
    'api::news-item.news-item',
    'api::structure.structure',
    'api::service-type.service-type',
    'api::knowledge-category.knowledge-category',
    'api::knowledge-base-entry.knowledge-base-entry',
    'api::tutorial.tutorial',
    'api::assessment-template.assessment-template',
    'api::about-page.about-page',
    'api::homepage.homepage',
    'api::community-profile.community-profile',
    'api::community-group.community-group',
    'api::community.community',
  ];

  for (const uid of publicContentTypes) {
    for (const action of ['find', 'findOne']) {
      const permission = await strapi.db
        .query('plugin::users-permissions.permission')
        .findOne({
          where: {
            role: authenticatedRole.id,
            action: `${uid}.${action}`,
          },
        });

      if (!permission) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .create({
            data: {
              role: authenticatedRole.id,
              action: `${uid}.${action}`,
              enabled: true,
            },
          });
      } else if (!permission.enabled) {
        await strapi.db
          .query('plugin::users-permissions.permission')
          .update({
            where: { id: permission.id },
            data: { enabled: true },
          });
      }
    }
  }

  strapi.log.info('Authenticated API permissions configured');
}
