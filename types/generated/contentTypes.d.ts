import type { Schema, Struct } from '@strapi/strapi';

export interface AdminApiToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_tokens';
  info: {
    description: '';
    displayName: 'Api Token';
    name: 'Api Token';
    pluralName: 'api-tokens';
    singularName: 'api-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    encryptedKey: Schema.Attribute.Text &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.Enumeration<['read-only', 'full-access', 'custom']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'read-only'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminApiTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_api_token_permissions';
  info: {
    description: '';
    displayName: 'API Token Permission';
    name: 'API Token Permission';
    pluralName: 'api-token-permissions';
    singularName: 'api-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::api-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::api-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminPermission extends Struct.CollectionTypeSchema {
  collectionName: 'admin_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'Permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    actionParameters: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    conditions: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<[]>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::permission'> &
      Schema.Attribute.Private;
    properties: Schema.Attribute.JSON & Schema.Attribute.DefaultTo<{}>;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'admin::role'>;
    subject: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminRole extends Struct.CollectionTypeSchema {
  collectionName: 'admin_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'Role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::role'> & Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'manyToMany', 'admin::user'>;
  };
}

export interface AdminSession extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_sessions';
  info: {
    description: 'Session Manager storage';
    displayName: 'Session';
    name: 'Session';
    pluralName: 'sessions';
    singularName: 'session';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
    i18n: {
      localized: false;
    };
  };
  attributes: {
    absoluteExpiresAt: Schema.Attribute.DateTime & Schema.Attribute.Private;
    childId: Schema.Attribute.String & Schema.Attribute.Private;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    deviceId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    expiresAt: Schema.Attribute.DateTime & Schema.Attribute.Required & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::session'> &
      Schema.Attribute.Private;
    origin: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    sessionId: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique;
    status: Schema.Attribute.String & Schema.Attribute.Private;
    type: Schema.Attribute.String & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    userId: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Private;
  };
}

export interface AdminTransferToken extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_tokens';
  info: {
    description: '';
    displayName: 'Transfer Token';
    name: 'Transfer Token';
    pluralName: 'transfer-tokens';
    singularName: 'transfer-token';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    accessKey: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }> &
      Schema.Attribute.DefaultTo<''>;
    expiresAt: Schema.Attribute.DateTime;
    lastUsedAt: Schema.Attribute.DateTime;
    lifespan: Schema.Attribute.BigInteger;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminTransferTokenPermission extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_transfer_token_permissions';
  info: {
    description: '';
    displayName: 'Transfer Token Permission';
    name: 'Transfer Token Permission';
    pluralName: 'transfer-token-permissions';
    singularName: 'transfer-token-permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::transfer-token-permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    token: Schema.Attribute.Relation<'manyToOne', 'admin::transfer-token'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface AdminUser extends Struct.CollectionTypeSchema {
  collectionName: 'admin_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'User';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    blocked: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    firstname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Private &
      Schema.Attribute.DefaultTo<false>;
    lastname: Schema.Attribute.String &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'admin::user'> & Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    preferedLanguage: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    registrationToken: Schema.Attribute.String & Schema.Attribute.Private;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    roles: Schema.Attribute.Relation<'manyToMany', 'admin::role'> & Schema.Attribute.Private;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String;
  };
}

export interface ApiAboutPageAboutPage extends Struct.SingleTypeSchema {
  collectionName: 'about_pages';
  info: {
    description: 'Page \u00C0 propos';
    displayName: 'About Page';
    pluralName: 'about-pages';
    singularName: 'about-page';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::about-page.about-page'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    teamMembers: Schema.Attribute.Component<'about.team-member', true>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    values: Schema.Attribute.Component<'about.value-card', true>;
  };
}

export interface ApiAssessmentTemplateAssessmentTemplate extends Struct.CollectionTypeSchema {
  collectionName: 'assessment_templates';
  info: {
    description: "Mod\u00E8les de questionnaires d'\u00E9valuation";
    displayName: 'Assessment Template';
    pluralName: 'assessment-templates';
    singularName: 'assessment-template';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    dimensions: Schema.Attribute.Component<'assessment.dimension', true> &
      Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::assessment-template.assessment-template'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    questions: Schema.Attribute.Component<'assessment.question', true> & Schema.Attribute.Required;
    scoringMethod: Schema.Attribute.Enumeration<['sum', 'average', 'weighted', 'custom']> &
      Schema.Attribute.Required;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    version: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface ApiBlogArticleBlogArticle extends Struct.CollectionTypeSchema {
  collectionName: 'blog_articles';
  info: {
    description: 'Articles du blog';
    displayName: 'Blog Article';
    pluralName: 'blog-articles';
    singularName: 'blog-article';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    author: Schema.Attribute.Relation<'manyToOne', 'api::contributor-profile.contributor-profile'>;
    category: Schema.Attribute.Relation<'manyToOne', 'api::blog-category.blog-category'>;
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    excerpt: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 160;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::blog-article.blog-article'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seoMeta: Schema.Attribute.Component<'shared.seo-meta', false>;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['draft', 'in_review', 'published', 'archived']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiBlogCategoryBlogCategory extends Struct.CollectionTypeSchema {
  collectionName: 'blog_categories';
  info: {
    description: 'Cat\u00E9gories du blog';
    displayName: 'Blog Category';
    pluralName: 'blog-categories';
    singularName: 'blog-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    articles: Schema.Attribute.Relation<'oneToMany', 'api::blog-article.blog-article'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::blog-category.blog-category'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiCommunityGroupCommunityGroup extends Struct.CollectionTypeSchema {
  collectionName: 'community_groups';
  info: {
    description: 'Groupes communautaires (visio ou pr\u00E9sentiel)';
    displayName: 'Community Group';
    pluralName: 'community-groups';
    singularName: 'community-group';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    createdByMember: Schema.Attribute.Relation<
      'manyToOne',
      'api::community-profile.community-profile'
    >;
    description: Schema.Attribute.Blocks & Schema.Attribute.Required;
    groupType: Schema.Attribute.Enumeration<['video', 'in_person', 'hybrid']> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::community-group.community-group'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.Component<'location.address', false>;
    maxMembers: Schema.Attribute.Integer;
    meetingLink: Schema.Attribute.String;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    schedule: Schema.Attribute.Text;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['draft', 'active', 'archived', 'cancelled']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    structure: Schema.Attribute.Relation<'manyToOne', 'api::structure.structure'>;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiCommunityProfileCommunityProfile extends Struct.CollectionTypeSchema {
  collectionName: 'community_profiles';
  info: {
    description: 'Profil communautaire opt-in visible par les pairs';
    displayName: 'Community Profile';
    pluralName: 'community-profiles';
    singularName: 'community-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    avatar: Schema.Attribute.Media<'images'>;
    bio: Schema.Attribute.Text;
    companionSince: Schema.Attribute.Date;
    contactPreference: Schema.Attribute.Enumeration<['platform_message', 'email', 'none']> &
      Schema.Attribute.DefaultTo<'none'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    isCompanion: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isVisible: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    joinedAt: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::community-profile.community-profile'
    > &
      Schema.Attribute.Private;
    pseudonym: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    recoveryPath: Schema.Attribute.Text;
    recoveryTags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    sharedFlowerScores: Schema.Attribute.JSON;
    specialties: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiCompanionBookmarkCompanionBookmark extends Struct.CollectionTypeSchema {
  collectionName: 'companion_bookmarks';
  info: {
    description: 'Compagnons enregistr\u00E9s dans le r\u00E9pertoire personnel';
    displayName: 'Companion Bookmark';
    pluralName: 'companion-bookmarks';
    singularName: 'companion-bookmark';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['personalNote'];
    };
  };
  attributes: {
    addedAt: Schema.Attribute.DateTime;
    companion: Schema.Attribute.Relation<'manyToOne', 'api::community-profile.community-profile'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    isPinned: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::companion-bookmark.companion-bookmark'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    personalNote: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiContributionContribution extends Struct.CollectionTypeSchema {
  collectionName: 'contributions';
  info: {
    description: 'Contributions soumises par les membres';
    displayName: 'Contribution';
    pluralName: 'contributions';
    singularName: 'contribution';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    contributor: Schema.Attribute.Relation<
      'manyToOne',
      'api::contributor-profile.contributor-profile'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    data: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::contribution.contribution'> &
      Schema.Attribute.Private;
    moderationNote: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    relatedContent: Schema.Attribute.String;
    status: Schema.Attribute.Enumeration<['pending', 'approved', 'rejected', 'revision_needed']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'pending'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['structure', 'event', 'resource', 'blog_article', 'correction']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiContributorProfileContributorProfile extends Struct.CollectionTypeSchema {
  collectionName: 'contributor_profiles';
  info: {
    description: 'Profil public du contributeur';
    displayName: 'Contributor Profile';
    pluralName: 'contributor-profiles';
    singularName: 'contributor-profile';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    authoredArticles: Schema.Attribute.Relation<'oneToMany', 'api::blog-article.blog-article'>;
    avatar: Schema.Attribute.Media<'images'>;
    bio: Schema.Attribute.Text;
    contributions: Schema.Attribute.Relation<'oneToMany', 'api::contribution.contribution'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    displayName: Schema.Attribute.String & Schema.Attribute.Required;
    joinedAt: Schema.Attribute.Date;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::contributor-profile.contributor-profile'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Enumeration<['member', 'contributor', 'moderator', 'peer_helper']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'member'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    user: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
  };
}

export interface ApiDocumentTemplateDocumentTemplate extends Struct.CollectionTypeSchema {
  collectionName: 'document_templates';
  info: {
    description: 'Mod\u00E8les de documents';
    displayName: 'Document Template';
    pluralName: 'document-templates';
    singularName: 'document-template';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    category: Schema.Attribute.Enumeration<
      ['medical_report', 'personal_plan', 'crisis_plan', 'wellness_plan', 'other']
    > &
      Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    fields: Schema.Attribute.JSON & Schema.Attribute.Required;
    isActive: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<true>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::document-template.document-template'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    pdfTemplate: Schema.Attribute.Media;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiEarlyWarningSignEarlyWarningSign extends Struct.CollectionTypeSchema {
  collectionName: 'early_warning_signs';
  info: {
    description: 'Signaux avant-coureurs personnels';
    displayName: 'Early Warning Sign';
    pluralName: 'early-warning-signs';
    singularName: 'early-warning-sign';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['signs'];
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::early-warning-sign.early-warning-sign'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    signs: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiEventRegistrationEventRegistration extends Struct.CollectionTypeSchema {
  collectionName: 'event_registrations';
  info: {
    description: 'Inscriptions aux \u00E9v\u00E9nements et groupes';
    displayName: 'Event Registration';
    pluralName: 'event-registrations';
    singularName: 'event-registration';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
  };
  attributes: {
    communityGroup: Schema.Attribute.Relation<'manyToOne', 'api::community-group.community-group'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    event: Schema.Attribute.Relation<'manyToOne', 'api::event.event'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::event-registration.event-registration'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    personalCalendarEvent: Schema.Attribute.Relation<
      'oneToOne',
      'api::personal-calendar-event.personal-calendar-event'
    >;
    publishedAt: Schema.Attribute.DateTime;
    registeredAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['registered', 'waitlisted', 'cancelled']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'registered'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiEventEvent extends Struct.CollectionTypeSchema {
  collectionName: 'events';
  info: {
    description: '\u00C9v\u00E9nements / Agenda';
    displayName: 'Event';
    pluralName: 'events';
    singularName: 'event';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Blocks & Schema.Attribute.Required;
    endDate: Schema.Attribute.DateTime;
    eventType: Schema.Attribute.Enumeration<
      ['workshop', 'conference', 'meetup', 'support_group', 'training', 'other']
    > &
      Schema.Attribute.Required;
    isAllDay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    isOnline: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::event.event'> &
      Schema.Attribute.Private;
    location: Schema.Attribute.Component<'location.address', false>;
    maxParticipants: Schema.Attribute.Integer;
    onlineLink: Schema.Attribute.String;
    organizer: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    startDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    status: Schema.Attribute.Enumeration<['draft', 'in_review', 'published', 'cancelled']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'draft'>;
    structure: Schema.Attribute.Relation<'manyToOne', 'api::structure.structure'>;
    submittedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::contributor-profile.contributor-profile'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiGeneratedDocumentGeneratedDocument extends Struct.CollectionTypeSchema {
  collectionName: 'generated_documents';
  info: {
    description: 'Documents g\u00E9n\u00E9r\u00E9s par les membres';
    displayName: 'Generated Document';
    pluralName: 'generated-documents';
    singularName: 'generated-document';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['generatedData'];
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    generatedAt: Schema.Attribute.DateTime;
    generatedData: Schema.Attribute.JSON & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::generated-document.generated-document'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    pdfFile: Schema.Attribute.Media<'files'>;
    publishedAt: Schema.Attribute.DateTime;
    template: Schema.Attribute.Relation<'manyToOne', 'api::document-template.document-template'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiHomepageHomepage extends Struct.SingleTypeSchema {
  collectionName: 'homepages';
  info: {
    description: "Page d'accueil";
    displayName: 'Homepage';
    pluralName: 'homepages';
    singularName: 'homepage';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    ctaLink: Schema.Attribute.String;
    ctaText: Schema.Attribute.String;
    featuredArticles: Schema.Attribute.Relation<'oneToMany', 'api::blog-article.blog-article'>;
    featuredEvents: Schema.Attribute.Relation<'oneToMany', 'api::event.event'>;
    heroImage: Schema.Attribute.Media<'images'>;
    heroSubtitle: Schema.Attribute.Text;
    heroTitle: Schema.Attribute.String & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::homepage.homepage'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiKnowledgeBaseEntryKnowledgeBaseEntry extends Struct.CollectionTypeSchema {
  collectionName: 'knowledge_base_entries';
  info: {
    description: 'Base de connaissances';
    displayName: 'Knowledge Base Entry';
    pluralName: 'knowledge-base-entries';
    singularName: 'knowledge-base-entry';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Relation<'manyToOne', 'api::knowledge-category.knowledge-category'>;
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    difficulty: Schema.Attribute.Enumeration<['beginner', 'intermediate', 'advanced']>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::knowledge-base-entry.knowledge-base-entry'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    seoMeta: Schema.Attribute.Component<'shared.seo-meta', false>;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    submittedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::contributor-profile.contributor-profile'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiKnowledgeCategoryKnowledgeCategory extends Struct.CollectionTypeSchema {
  collectionName: 'knowledge_categories';
  info: {
    description: 'Cat\u00E9gories de la base de connaissances';
    displayName: 'Knowledge Category';
    pluralName: 'knowledge-categories';
    singularName: 'knowledge-category';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    entries: Schema.Attribute.Relation<
      'oneToMany',
      'api::knowledge-base-entry.knowledge-base-entry'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::knowledge-category.knowledge-category'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    parentCategory: Schema.Attribute.Relation<
      'manyToOne',
      'api::knowledge-category.knowledge-category'
    >;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiNewsItemNewsItem extends Struct.CollectionTypeSchema {
  collectionName: 'news_items';
  info: {
    description: 'Actualit\u00E9s';
    displayName: 'News Item';
    pluralName: 'news-items';
    singularName: 'news-item';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    content: Schema.Attribute.Blocks & Schema.Attribute.Required;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    excerpt: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::news-item.news-item'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    source: Schema.Attribute.String;
    submittedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::contributor-profile.contributor-profile'
    >;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPersonalCalendarEventPersonalCalendarEvent extends Struct.CollectionTypeSchema {
  collectionName: 'personal_calendar_events';
  info: {
    description: 'Calendrier personnel du membre';
    displayName: 'Personal Calendar Event';
    pluralName: 'personal-calendar-events';
    singularName: 'personal-calendar-event';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['title', 'description'];
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    endDate: Schema.Attribute.DateTime;
    eventType: Schema.Attribute.Enumeration<
      ['appointment', 'medication', 'activity', 'goal_milestone', 'custom']
    >;
    googleEventId: Schema.Attribute.String;
    isAllDay: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::personal-calendar-event.personal-calendar-event'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    recurrence: Schema.Attribute.JSON;
    reminder: Schema.Attribute.JSON;
    startDate: Schema.Attribute.DateTime & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPersonalGoalPersonalGoal extends Struct.CollectionTypeSchema {
  collectionName: 'personal_goals';
  info: {
    description: 'Objectifs personnels';
    displayName: 'Personal Goal';
    pluralName: 'personal-goals';
    singularName: 'personal-goal';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['title', 'description'];
    };
  };
  attributes: {
    actionItems: Schema.Attribute.JSON;
    barriers: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text;
    facilitators: Schema.Attribute.JSON;
    frequency: Schema.Attribute.String;
    horizon: Schema.Attribute.Enumeration<['short_term', 'medium_term', 'long_term']> &
      Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::personal-goal.personal-goal'> &
      Schema.Attribute.Private;
    milestones: Schema.Attribute.Component<'goal.milestone', true>;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    progress: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 100;
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['not_started', 'in_progress', 'completed', 'abandoned']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'not_started'>;
    targetDate: Schema.Attribute.Date;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPersonalNotebookPersonalNotebook extends Struct.CollectionTypeSchema {
  collectionName: 'personal_notebooks';
  info: {
    description: 'Carnet de bord personnel';
    displayName: 'Personal Notebook';
    pluralName: 'personal-notebooks';
    singularName: 'personal-notebook';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['title', 'content'];
    };
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    date: Schema.Attribute.Date & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::personal-notebook.personal-notebook'
    > &
      Schema.Attribute.Private;
    mood: Schema.Attribute.Enumeration<['very_bad', 'bad', 'neutral', 'good', 'very_good']>;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    tags: Schema.Attribute.JSON;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiPlatformSettingPlatformSetting extends Struct.SingleTypeSchema {
  collectionName: 'platform_settings';
  info: {
    description: 'Param\u00E8tres de la plateforme';
    displayName: 'Platform Settings';
    pluralName: 'platform-settings';
    singularName: 'platform-setting';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    defaultAssessmentTemplate: Schema.Attribute.Relation<
      'oneToOne',
      'api::assessment-template.assessment-template'
    >;
    favicon: Schema.Attribute.Media<'images'>;
    googleCalendarClientId: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::platform-setting.platform-setting'
    > &
      Schema.Attribute.Private;
    logo: Schema.Attribute.Media<'images'>;
    maintenanceMode: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    publishedAt: Schema.Attribute.DateTime;
    siteDescription: Schema.Attribute.Text;
    siteName: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiRecoveryProfileRecoveryProfile extends Struct.CollectionTypeSchema {
  collectionName: 'recovery_profiles';
  info: {
    description: 'Profil de r\u00E9tablissement';
    displayName: 'Recovery Profile';
    pluralName: 'recovery-profiles';
    singularName: 'recovery-profile';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: [
        'selfDeterminedNeeds',
        'strengths',
        'preferences',
        'wellnessDefinition',
        'dreams',
        'emergencyContacts',
        'copingStrategies',
      ];
    };
  };
  attributes: {
    copingStrategies: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    crisisPlanStatus: Schema.Attribute.Enumeration<['green', 'amber', 'red']> &
      Schema.Attribute.DefaultTo<'green'>;
    dreams: Schema.Attribute.JSON;
    emergencyContacts: Schema.Attribute.JSON;
    lastUpdated: Schema.Attribute.DateTime;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recovery-profile.recovery-profile'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
    preferences: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    recoveryStage: Schema.Attribute.Enumeration<
      ['moratorium', 'awareness', 'preparation', 'rebuilding', 'growth']
    >;
    selfDeterminedNeeds: Schema.Attribute.JSON;
    strengths: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    wellnessDefinition: Schema.Attribute.Text;
  };
}

export interface ApiRecoveryRecommendationRecoveryRecommendation
  extends Struct.CollectionTypeSchema {
  collectionName: 'recovery_recommendations';
  info: {
    description: 'Recommandations de r\u00E9tablissement';
    displayName: 'Recovery Recommendation';
    pluralName: 'recovery-recommendations';
    singularName: 'recovery-recommendation';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    encryption: {
      enabled: true;
      fields: ['reason'];
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    isDismissed: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    isViewed: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::recovery-recommendation.recovery-recommendation'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    reason: Schema.Attribute.Text;
    relevanceScore: Schema.Attribute.Decimal;
    targetContentId: Schema.Attribute.Integer & Schema.Attribute.Required;
    targetContentType: Schema.Attribute.String & Schema.Attribute.Required;
    type: Schema.Attribute.Enumeration<
      ['article', 'tutorial', 'event', 'structure', 'assessment', 'goal_suggestion']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSelfAssessmentSelfAssessment extends Struct.CollectionTypeSchema {
  collectionName: 'self_assessments';
  info: {
    description: 'Auto-\u00E9valuations compl\u00E9t\u00E9es';
    displayName: 'Self Assessment';
    pluralName: 'self-assessments';
    singularName: 'self-assessment';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['responses', 'scores', 'personalNote'];
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    globalScore: Schema.Attribute.Decimal;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::self-assessment.self-assessment'> &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    personalNote: Schema.Attribute.Text;
    publishedAt: Schema.Attribute.DateTime;
    responses: Schema.Attribute.JSON & Schema.Attribute.Required;
    scores: Schema.Attribute.JSON & Schema.Attribute.Required;
    template: Schema.Attribute.Relation<
      'manyToOne',
      'api::assessment-template.assessment-template'
    >;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSelfProblemSolvingSelfProblemSolving extends Struct.CollectionTypeSchema {
  collectionName: 'self_problem_solvings';
  info: {
    description: 'Atelier des Solutions \u2014 r\u00E9solution de probl\u00E8mes en 6 \u00E9tapes';
    displayName: 'Self Problem Solving';
    pluralName: 'self-problem-solvings';
    singularName: 'self-problem-solving';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: [
        'title',
        'challengeReformulation',
        'situation',
        'objective',
        'mainObstacle',
        'slicingComponents',
        'brainstormingIdeas',
        'solutionAnalysis',
        'actionPlanWhat',
        'actionPlanWhere',
        'actionPlanWithWhom',
        'obstacles',
        'iceBreaker',
        'actionSteps',
        'reviewWhatWorked',
        'reviewWhatFailed',
      ];
    };
  };
  attributes: {
    acceptanceChecked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    actionPlanWhat: Schema.Attribute.Text;
    actionPlanWhen: Schema.Attribute.String;
    actionPlanWhere: Schema.Attribute.String;
    actionPlanWithWhom: Schema.Attribute.String;
    actionSteps: Schema.Attribute.JSON;
    activeSubProblem: Schema.Attribute.String;
    brainstormingIdeas: Schema.Attribute.JSON;
    category: Schema.Attribute.Enumeration<
      ['financial', 'relational', 'health', 'work', 'housing', 'administrative', 'other']
    > &
      Schema.Attribute.Required;
    challengeReformulation: Schema.Attribute.Text;
    chosenSolutionIndex: Schema.Attribute.Integer;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    currentStep: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 1;
        },
        number
      > &
      Schema.Attribute.DefaultTo<1>;
    iceBreaker: Schema.Attribute.Text;
    isHypothetical: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::self-problem-solving.self-problem-solving'
    > &
      Schema.Attribute.Private;
    mainObstacle: Schema.Attribute.Text;
    needsSlicing: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    objective: Schema.Attribute.Text;
    obstacles: Schema.Attribute.JSON;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    reviewDate: Schema.Attribute.Date;
    reviewOutcome: Schema.Attribute.Enumeration<['pending', 'success', 'adjust', 'new_solution']>;
    reviewWhatFailed: Schema.Attribute.Text;
    reviewWhatWorked: Schema.Attribute.Text;
    situation: Schema.Attribute.Text;
    slicingComponents: Schema.Attribute.JSON;
    solutionAnalysis: Schema.Attribute.JSON;
    status: Schema.Attribute.Enumeration<
      ['in_progress', 'waiting_review', 'completed', 'abandoned']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'in_progress'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiServiceTypeServiceType extends Struct.CollectionTypeSchema {
  collectionName: 'service_types';
  info: {
    description: 'Types de services';
    displayName: 'Service Type';
    pluralName: 'service-types';
    singularName: 'service-type';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    icon: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::service-type.service-type'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    structures: Schema.Attribute.Relation<'manyToMany', 'api::structure.structure'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSituationObjectiveSituationObjective extends Struct.CollectionTypeSchema {
  collectionName: 'situation_objectives';
  info: {
    description: 'Objectifs li\u00E9s au d\u00E9codeur de situations';
    displayName: 'Situation Objective';
    pluralName: 'situation-objectives';
    singularName: 'situation-objective';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['title', 'actionWhat', 'whatWorked', 'whatDidntWork'];
    };
  };
  attributes: {
    actionWhat: Schema.Attribute.Text;
    actionWhen: Schema.Attribute.DateTime;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::situation-objective.situation-objective'
    > &
      Schema.Attribute.Private;
    observation: Schema.Attribute.Relation<
      'manyToOne',
      'api::situation-observation.situation-observation'
    >;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    problemType: Schema.Attribute.Enumeration<['practical', 'hypothetical']> &
      Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['planned', 'completed', 'failed']> &
      Schema.Attribute.DefaultTo<'planned'>;
    targetIntensity: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          max: 6;
          min: 0;
        },
        number
      >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    whatDidntWork: Schema.Attribute.Text;
    whatWorked: Schema.Attribute.Text;
  };
}

export interface ApiSituationObservationSituationObservation extends Struct.CollectionTypeSchema {
  collectionName: 'situation_observations';
  info: {
    description: 'Observations du d\u00E9codeur de situations';
    displayName: 'Situation Observation';
    pluralName: 'situation-observations';
    singularName: 'situation-observation';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['triggerDescription', 'thoughts', 'emotions', 'sensations', 'behaviors'];
    };
  };
  attributes: {
    behaviors: Schema.Attribute.JSON;
    category: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    date: Schema.Attribute.DateTime & Schema.Attribute.Required;
    emotions: Schema.Attribute.JSON;
    intensity: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          max: 10;
          min: 1;
        },
        number
      >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::situation-observation.situation-observation'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    sensations: Schema.Attribute.JSON;
    thoughts: Schema.Attribute.JSON;
    triggerDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    triggerType: Schema.Attribute.Enumeration<
      ['exposition', 'anticipatory_thought', 'physical_sensation', 'spontaneous']
    > &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiSituationThesaurusSituationThesaurus extends Struct.CollectionTypeSchema {
  collectionName: 'situation_thesauruses';
  info: {
    description: 'Th\u00E9saurus personnel de tags pour le d\u00E9codeur';
    displayName: 'Situation Thesaurus';
    pluralName: 'situation-thesauruses';
    singularName: 'situation-thesaurus';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: true;
    };
    encryption: {
      enabled: true;
      fields: ['categories', 'thoughts', 'emotions', 'sensations', 'behaviors'];
    };
  };
  attributes: {
    behaviors: Schema.Attribute.JSON;
    categories: Schema.Attribute.JSON;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    emotions: Schema.Attribute.JSON;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'api::situation-thesaurus.situation-thesaurus'
    > &
      Schema.Attribute.Private;
    owner: Schema.Attribute.Relation<'oneToOne', 'plugin::users-permissions.user'>;
    publishedAt: Schema.Attribute.DateTime;
    sensations: Schema.Attribute.JSON;
    thoughts: Schema.Attribute.JSON;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiStructureStructure extends Struct.CollectionTypeSchema {
  collectionName: 'structures';
  info: {
    description: 'Annuaire des structures';
    displayName: 'Structure';
    pluralName: 'structures';
    singularName: 'structure';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    address: Schema.Attribute.Component<'location.address', false> & Schema.Attribute.Required;
    coordinates: Schema.Attribute.Component<'location.coordinates', false> &
      Schema.Attribute.Required;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Blocks & Schema.Attribute.Required;
    email: Schema.Attribute.Email;
    isVerified: Schema.Attribute.Boolean &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<false>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::structure.structure'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    openingHours: Schema.Attribute.Component<'schedule.opening-slot', true>;
    phone: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    services: Schema.Attribute.Relation<'manyToMany', 'api::service-type.service-type'>;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    submittedBy: Schema.Attribute.Relation<
      'manyToOne',
      'api::contributor-profile.contributor-profile'
    >;
    type: Schema.Attribute.Enumeration<['public', 'association', 'private', 'community']> &
      Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    website: Schema.Attribute.String;
  };
}

export interface ApiTagTag extends Struct.CollectionTypeSchema {
  collectionName: 'tags';
  info: {
    description: 'Tags transversaux';
    displayName: 'Tag';
    pluralName: 'tags';
    singularName: 'tag';
  };
  options: {
    draftAndPublish: false;
  };
  attributes: {
    blogArticles: Schema.Attribute.Relation<'manyToMany', 'api::blog-article.blog-article'>;
    communityGroups: Schema.Attribute.Relation<
      'manyToMany',
      'api::community-group.community-group'
    >;
    communityProfiles: Schema.Attribute.Relation<
      'manyToMany',
      'api::community-profile.community-profile'
    >;
    communityProfileSpecialties: Schema.Attribute.Relation<
      'manyToMany',
      'api::community-profile.community-profile'
    >;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    events: Schema.Attribute.Relation<'manyToMany', 'api::event.event'>;
    knowledgeBaseEntries: Schema.Attribute.Relation<
      'manyToMany',
      'api::knowledge-base-entry.knowledge-base-entry'
    >;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tag.tag'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    newsItems: Schema.Attribute.Relation<'manyToMany', 'api::news-item.news-item'>;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'name'> & Schema.Attribute.Required;
    tutorials: Schema.Attribute.Relation<'manyToMany', 'api::tutorial.tutorial'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface ApiTutorialTutorial extends Struct.CollectionTypeSchema {
  collectionName: 'tutorials';
  info: {
    description: 'Tutoriels pas \u00E0 pas';
    displayName: 'Tutorial';
    pluralName: 'tutorials';
    singularName: 'tutorial';
  };
  options: {
    draftAndPublish: true;
  };
  attributes: {
    category: Schema.Attribute.Relation<'manyToOne', 'api::knowledge-category.knowledge-category'>;
    coverImage: Schema.Attribute.Media<'images'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'api::tutorial.tutorial'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    slug: Schema.Attribute.UID<'title'> & Schema.Attribute.Required;
    steps: Schema.Attribute.Component<'tutorial.step', true> & Schema.Attribute.Required;
    tags: Schema.Attribute.Relation<'manyToMany', 'api::tag.tag'>;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesRelease extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_releases';
  info: {
    displayName: 'Release';
    pluralName: 'releases';
    singularName: 'release';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    actions: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release-action'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::content-releases.release'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    publishedAt: Schema.Attribute.DateTime;
    releasedAt: Schema.Attribute.DateTime;
    scheduledAt: Schema.Attribute.DateTime;
    status: Schema.Attribute.Enumeration<['ready', 'blocked', 'failed', 'done', 'empty']> &
      Schema.Attribute.Required;
    timezone: Schema.Attribute.String;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginContentReleasesReleaseAction extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_release_actions';
  info: {
    displayName: 'Release Action';
    pluralName: 'release-actions';
    singularName: 'release-action';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentType: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    entryDocumentId: Schema.Attribute.String;
    isEntryValid: Schema.Attribute.Boolean;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::content-releases.release-action'
    > &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    release: Schema.Attribute.Relation<'manyToOne', 'plugin::content-releases.release'>;
    type: Schema.Attribute.Enumeration<['publish', 'unpublish']> & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginI18NLocale extends Struct.CollectionTypeSchema {
  collectionName: 'i18n_locale';
  info: {
    collectionName: 'locales';
    description: '';
    displayName: 'Locale';
    pluralName: 'locales';
    singularName: 'locale';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    code: Schema.Attribute.String & Schema.Attribute.Unique;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::i18n.locale'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.SetMinMax<
        {
          max: 50;
          min: 1;
        },
        number
      >;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflow extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows';
  info: {
    description: '';
    displayName: 'Workflow';
    name: 'Workflow';
    pluralName: 'workflows';
    singularName: 'workflow';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    contentTypes: Schema.Attribute.JSON &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'[]'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    stageRequiredToPublish: Schema.Attribute.Relation<
      'oneToOne',
      'plugin::review-workflows.workflow-stage'
    >;
    stages: Schema.Attribute.Relation<'oneToMany', 'plugin::review-workflows.workflow-stage'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginReviewWorkflowsWorkflowStage extends Struct.CollectionTypeSchema {
  collectionName: 'strapi_workflows_stages';
  info: {
    description: '';
    displayName: 'Stages';
    name: 'Workflow Stage';
    pluralName: 'workflow-stages';
    singularName: 'workflow-stage';
  };
  options: {
    draftAndPublish: false;
    version: '1.1.0';
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    color: Schema.Attribute.String & Schema.Attribute.DefaultTo<'#4945FF'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<
      'oneToMany',
      'plugin::review-workflows.workflow-stage'
    > &
      Schema.Attribute.Private;
    name: Schema.Attribute.String;
    permissions: Schema.Attribute.Relation<'manyToMany', 'admin::permission'>;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    workflow: Schema.Attribute.Relation<'manyToOne', 'plugin::review-workflows.workflow'>;
  };
}

export interface PluginUploadFile extends Struct.CollectionTypeSchema {
  collectionName: 'files';
  info: {
    description: '';
    displayName: 'File';
    pluralName: 'files';
    singularName: 'file';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    alternativeText: Schema.Attribute.Text;
    caption: Schema.Attribute.Text;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    ext: Schema.Attribute.String;
    focalPoint: Schema.Attribute.JSON;
    folder: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    folderPath: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    formats: Schema.Attribute.JSON;
    hash: Schema.Attribute.String & Schema.Attribute.Required;
    height: Schema.Attribute.Integer;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'> &
      Schema.Attribute.Private;
    mime: Schema.Attribute.String & Schema.Attribute.Required;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    previewUrl: Schema.Attribute.Text;
    provider: Schema.Attribute.String & Schema.Attribute.Required;
    provider_metadata: Schema.Attribute.JSON;
    publishedAt: Schema.Attribute.DateTime;
    related: Schema.Attribute.Relation<'morphToMany'>;
    size: Schema.Attribute.Decimal & Schema.Attribute.Required;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    url: Schema.Attribute.Text & Schema.Attribute.Required;
    width: Schema.Attribute.Integer;
  };
}

export interface PluginUploadFolder extends Struct.CollectionTypeSchema {
  collectionName: 'upload_folders';
  info: {
    displayName: 'Folder';
    pluralName: 'folders';
    singularName: 'folder';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    children: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    files: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.file'>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::upload.folder'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    parent: Schema.Attribute.Relation<'manyToOne', 'plugin::upload.folder'>;
    path: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 1;
      }>;
    pathId: Schema.Attribute.Integer & Schema.Attribute.Required & Schema.Attribute.Unique;
    publishedAt: Schema.Attribute.DateTime;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsPermission extends Struct.CollectionTypeSchema {
  collectionName: 'up_permissions';
  info: {
    description: '';
    displayName: 'Permission';
    name: 'permission';
    pluralName: 'permissions';
    singularName: 'permission';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    action: Schema.Attribute.String & Schema.Attribute.Required;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'> &
      Schema.Attribute.Private;
    publishedAt: Schema.Attribute.DateTime;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
  };
}

export interface PluginUsersPermissionsRole extends Struct.CollectionTypeSchema {
  collectionName: 'up_roles';
  info: {
    description: '';
    displayName: 'Role';
    name: 'role';
    pluralName: 'roles';
    singularName: 'role';
  };
  options: {
    draftAndPublish: false;
  };
  pluginOptions: {
    'content-manager': {
      visible: false;
    };
    'content-type-builder': {
      visible: false;
    };
  };
  attributes: {
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    description: Schema.Attribute.String;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.role'> &
      Schema.Attribute.Private;
    name: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
    permissions: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.permission'>;
    publishedAt: Schema.Attribute.DateTime;
    type: Schema.Attribute.String & Schema.Attribute.Unique;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    users: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'>;
  };
}

export interface PluginUsersPermissionsUser extends Struct.CollectionTypeSchema {
  collectionName: 'up_users';
  info: {
    description: '';
    displayName: 'User';
    name: 'user';
    pluralName: 'users';
    singularName: 'user';
  };
  options: {
    draftAndPublish: false;
    timestamps: true;
  };
  attributes: {
    blocked: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    confirmationToken: Schema.Attribute.String & Schema.Attribute.Private;
    confirmed: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    createdAt: Schema.Attribute.DateTime;
    createdBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    email: Schema.Attribute.Email &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    locale: Schema.Attribute.String & Schema.Attribute.Private;
    localizations: Schema.Attribute.Relation<'oneToMany', 'plugin::users-permissions.user'> &
      Schema.Attribute.Private;
    password: Schema.Attribute.Password &
      Schema.Attribute.Private &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 6;
      }>;
    provider: Schema.Attribute.String;
    publishedAt: Schema.Attribute.DateTime;
    resetPasswordToken: Schema.Attribute.String & Schema.Attribute.Private;
    role: Schema.Attribute.Relation<'manyToOne', 'plugin::users-permissions.role'>;
    updatedAt: Schema.Attribute.DateTime;
    updatedBy: Schema.Attribute.Relation<'oneToOne', 'admin::user'> & Schema.Attribute.Private;
    username: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.Unique &
      Schema.Attribute.SetMinMaxLength<{
        minLength: 3;
      }>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ContentTypeSchemas {
      'admin::api-token': AdminApiToken;
      'admin::api-token-permission': AdminApiTokenPermission;
      'admin::permission': AdminPermission;
      'admin::role': AdminRole;
      'admin::session': AdminSession;
      'admin::transfer-token': AdminTransferToken;
      'admin::transfer-token-permission': AdminTransferTokenPermission;
      'admin::user': AdminUser;
      'api::about-page.about-page': ApiAboutPageAboutPage;
      'api::assessment-template.assessment-template': ApiAssessmentTemplateAssessmentTemplate;
      'api::blog-article.blog-article': ApiBlogArticleBlogArticle;
      'api::blog-category.blog-category': ApiBlogCategoryBlogCategory;
      'api::community-group.community-group': ApiCommunityGroupCommunityGroup;
      'api::community-profile.community-profile': ApiCommunityProfileCommunityProfile;
      'api::companion-bookmark.companion-bookmark': ApiCompanionBookmarkCompanionBookmark;
      'api::contribution.contribution': ApiContributionContribution;
      'api::contributor-profile.contributor-profile': ApiContributorProfileContributorProfile;
      'api::document-template.document-template': ApiDocumentTemplateDocumentTemplate;
      'api::early-warning-sign.early-warning-sign': ApiEarlyWarningSignEarlyWarningSign;
      'api::event-registration.event-registration': ApiEventRegistrationEventRegistration;
      'api::event.event': ApiEventEvent;
      'api::generated-document.generated-document': ApiGeneratedDocumentGeneratedDocument;
      'api::homepage.homepage': ApiHomepageHomepage;
      'api::knowledge-base-entry.knowledge-base-entry': ApiKnowledgeBaseEntryKnowledgeBaseEntry;
      'api::knowledge-category.knowledge-category': ApiKnowledgeCategoryKnowledgeCategory;
      'api::news-item.news-item': ApiNewsItemNewsItem;
      'api::personal-calendar-event.personal-calendar-event': ApiPersonalCalendarEventPersonalCalendarEvent;
      'api::personal-goal.personal-goal': ApiPersonalGoalPersonalGoal;
      'api::personal-notebook.personal-notebook': ApiPersonalNotebookPersonalNotebook;
      'api::platform-setting.platform-setting': ApiPlatformSettingPlatformSetting;
      'api::recovery-profile.recovery-profile': ApiRecoveryProfileRecoveryProfile;
      'api::recovery-recommendation.recovery-recommendation': ApiRecoveryRecommendationRecoveryRecommendation;
      'api::self-assessment.self-assessment': ApiSelfAssessmentSelfAssessment;
      'api::self-problem-solving.self-problem-solving': ApiSelfProblemSolvingSelfProblemSolving;
      'api::service-type.service-type': ApiServiceTypeServiceType;
      'api::situation-objective.situation-objective': ApiSituationObjectiveSituationObjective;
      'api::situation-observation.situation-observation': ApiSituationObservationSituationObservation;
      'api::situation-thesaurus.situation-thesaurus': ApiSituationThesaurusSituationThesaurus;
      'api::structure.structure': ApiStructureStructure;
      'api::tag.tag': ApiTagTag;
      'api::tutorial.tutorial': ApiTutorialTutorial;
      'plugin::content-releases.release': PluginContentReleasesRelease;
      'plugin::content-releases.release-action': PluginContentReleasesReleaseAction;
      'plugin::i18n.locale': PluginI18NLocale;
      'plugin::review-workflows.workflow': PluginReviewWorkflowsWorkflow;
      'plugin::review-workflows.workflow-stage': PluginReviewWorkflowsWorkflowStage;
      'plugin::upload.file': PluginUploadFile;
      'plugin::upload.folder': PluginUploadFolder;
      'plugin::users-permissions.permission': PluginUsersPermissionsPermission;
      'plugin::users-permissions.role': PluginUsersPermissionsRole;
      'plugin::users-permissions.user': PluginUsersPermissionsUser;
    }
  }
}
