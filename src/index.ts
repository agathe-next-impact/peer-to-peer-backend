import type { Core } from '@strapi/strapi';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Register encryption lifecycles for private content-types
    registerEncryptionLifecycles(strapi);

    // Configure permissions (bulk approach to minimize memory usage)
    await configurePermissions(strapi);
  },
};

/**
 * Ensures all required permissions exist and are enabled.
 * Uses bulk queries instead of individual ones to reduce memory pressure.
 */
async function configurePermissions(strapi: Core.Strapi) {
  const permQuery = strapi.db.query('plugin::users-permissions.permission');

  // Load both roles in parallel
  const [publicRole, authenticatedRole] = await Promise.all([
    strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } }),
    strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'authenticated' } }),
  ]);

  if (!publicRole || !authenticatedRole) return;

  // --- Build the desired action lists per role ---

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

  const authActions = [
    'plugin::users-permissions.auth.callback',
    'plugin::users-permissions.auth.register',
    'plugin::users-permissions.auth.forgotPassword',
    'plugin::users-permissions.auth.resetPassword',
  ];

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
    'api::self-determined-profile.self-determined-profile',
    'api::encryption-key-store.encryption-key-store',
  ];

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

  // Build { roleId, action } pairs
  const desired: { roleId: number; action: string }[] = [];

  // Public role: read public content + auth endpoints
  for (const uid of publicContentTypes) {
    for (const act of ['find', 'findOne']) {
      desired.push({ roleId: publicRole.id, action: `${uid}.${act}` });
    }
  }
  for (const act of authActions) {
    desired.push({ roleId: publicRole.id, action: act });
  }

  // Authenticated role: CRUD on private + read public + custom actions
  for (const uid of privateContentTypes) {
    for (const act of ['find', 'findOne', 'create', 'update', 'delete']) {
      desired.push({ roleId: authenticatedRole.id, action: `${uid}.${act}` });
    }
  }
  for (const uid of publicContentTypes) {
    for (const act of ['find', 'findOne']) {
      desired.push({ roleId: authenticatedRole.id, action: `${uid}.${act}` });
    }
  }
  for (const act of customActions) {
    desired.push({ roleId: authenticatedRole.id, action: act });
  }

  // --- Load ALL existing permissions for both roles in one query ---

  const roleIds = [publicRole.id, authenticatedRole.id];
  const existingPermissions = await permQuery.findMany({
    where: { role: { $in: roleIds } },
    select: ['id', 'action'],
    populate: ['role'],
  });

  // Index by "roleId::action" for O(1) lookups
  const permIndex = new Set<string>();
  for (const p of existingPermissions) {
    const roleId = typeof p.role === 'object' ? p.role?.id : p.role;
    permIndex.add(`${roleId}::${p.action}`);
  }

  // --- Create missing permissions (batch to reduce memory pressure) ---

  const missing = desired.filter(({ roleId, action }) => !permIndex.has(`${roleId}::${action}`));

  // Process in small batches of 10 to limit peak memory
  for (let i = 0; i < missing.length; i += 10) {
    const batch = missing.slice(i, i + 10);
    await Promise.all(
      batch.map(({ roleId, action }) => permQuery.create({ data: { role: roleId, action } }))
    );
  }

  strapi.log.info('All API permissions configured');
}
