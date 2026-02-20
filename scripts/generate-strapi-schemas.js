#!/usr/bin/env node

/**
 * ============================================================================
 * STRAPI SCHEMA GENERATOR
 * ============================================================================
 *
 * Ce script génère automatiquement l'ensemble de la structure Strapi v4/v5 :
 *   - Composants partagés (shared, location, schedule, tutorial, goal, assessment, about)
 *   - Collection Types (zones publique, membre, privée)
 *   - Single Types (homepage, about-page, platform-settings)
 *
 * Usage :
 *   node generate-strapi-schemas.js [--output <chemin>] [--dry-run]
 *
 * Options :
 *   --output <chemin>  Répertoire de sortie (défaut: ./src)
 *   --dry-run          Affiche la structure sans créer les fichiers
 *
 * Le script crée la structure suivante dans <output>/
 *   ├── components/
 *   │   ├── shared/        (seo-meta)
 *   │   ├── location/      (address, coordinates)
 *   │   ├── schedule/      (opening-slot)
 *   │   ├── tutorial/      (step)
 *   │   ├── goal/          (milestone)
 *   │   ├── assessment/    (dimension, question)
 *   │   └── about/         (team-member, value-card)
 *   ├── api/
 *   │   ├── blog-article/
 *   │   ├── blog-category/
 *   │   ├── ... (toutes les collections)
 *   │   ├── homepage/          (single type)
 *   │   ├── about-page/        (single type)
 *   │   └── platform-settings/ (single type)
 *   └── extensions/
 *       └── encryption/        (middleware de chiffrement)
 */

const fs = require("fs");
const path = require("path");

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const outputIdx = args.indexOf("--output");
const OUTPUT_DIR = outputIdx !== -1 ? args[outputIdx + 1] : "./src";

// ============================================================================
// HELPERS
// ============================================================================

function writeJSON(filePath, data) {
  const fullPath = path.resolve(OUTPUT_DIR, filePath);
  if (dryRun) {
    console.log(`  [DRY-RUN] ${fullPath}`);
    return;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`  ✅ ${fullPath}`);
}

function writeFile(filePath, content) {
  const fullPath = path.resolve(OUTPUT_DIR, filePath);
  if (dryRun) {
    console.log(`  [DRY-RUN] ${fullPath}`);
    return;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, "utf-8");
  console.log(`  ✅ ${fullPath}`);
}

/**
 * Génère un schéma Strapi content-type standard
 */
function makeContentTypeSchema(singularName, pluralName, displayName, attributes, opts = {}) {
  const kind = opts.kind || "collectionType";
  const draftAndPublish = opts.draftAndPublish !== undefined ? opts.draftAndPublish : true;

  return {
    kind,
    collectionName: pluralName.replace(/-/g, "_"),
    info: {
      singularName,
      pluralName,
      displayName,
      description: opts.description || "",
    },
    options: {
      draftAndPublish,
    },
    pluginOptions: opts.pluginOptions || {},
    attributes,
  };
}

/**
 * Génère la structure de dossiers d'un content-type Strapi
 */
function generateContentType(apiName, schema) {
  const basePath = `api/${apiName}`;
  writeJSON(`${basePath}/content-types/${apiName}/schema.json`, schema);

  // Routes
  const routeContent =
    schema.kind === "singleType"
      ? {
          routes: [
            {
              method: "GET",
              path: `/${apiName}`,
              handler: `${apiName}.find`,
              config: { policies: [] },
            },
            {
              method: "PUT",
              path: `/${apiName}`,
              handler: `${apiName}.update`,
              config: { policies: [] },
            },
            {
              method: "DELETE",
              path: `/${apiName}`,
              handler: `${apiName}.delete`,
              config: { policies: [] },
            },
          ],
        }
      : {
          routes: [
            {
              method: "GET",
              path: `/${apiName}s`,
              handler: `${apiName}.find`,
              config: { policies: [] },
            },
            {
              method: "GET",
              path: `/${apiName}s/:id`,
              handler: `${apiName}.findOne`,
              config: { policies: [] },
            },
            {
              method: "POST",
              path: `/${apiName}s`,
              handler: `${apiName}.create`,
              config: { policies: [] },
            },
            {
              method: "PUT",
              path: `/${apiName}s/:id`,
              handler: `${apiName}.update`,
              config: { policies: [] },
            },
            {
              method: "DELETE",
              path: `/${apiName}s/:id`,
              handler: `${apiName}.delete`,
              config: { policies: [] },
            },
          ],
        };
  writeJSON(`${basePath}/routes/${apiName}.json`, routeContent);

  // Controllers
  const controllerCode = `'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::${apiName}.${apiName}');
`;
  writeFile(`${basePath}/controllers/${apiName}.js`, controllerCode);

  // Services
  const serviceCode = `'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::${apiName}.${apiName}');
`;
  writeFile(`${basePath}/services/${apiName}.js`, serviceCode);
}

// ============================================================================
// 1. COMPOSANTS
// ============================================================================

function generateComponents() {
  console.log("\n📦 Génération des composants...\n");

  // --- shared.seo-meta ---
  writeJSON("components/shared/seo-meta.json", {
    collectionName: "components_shared_seo_meta",
    info: {
      displayName: "SEO Meta",
      icon: "search",
      description: "Métadonnées SEO",
    },
    options: {},
    attributes: {
      metaTitle: { type: "string", maxLength: 60 },
      metaDescription: { type: "text", maxLength: 160 },
      ogImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      canonicalUrl: { type: "string" },
    },
  });

  // --- location.address ---
  writeJSON("components/location/address.json", {
    collectionName: "components_location_address",
    info: {
      displayName: "Address",
      icon: "pinMap",
      description: "Adresse postale",
    },
    options: {},
    attributes: {
      street: { type: "string" },
      postalCode: { type: "string" },
      city: { type: "string", required: true },
      department: { type: "string" },
      region: { type: "string" },
      country: { type: "string", default: "France" },
    },
  });

  // --- location.coordinates ---
  writeJSON("components/location/coordinates.json", {
    collectionName: "components_location_coordinates",
    info: {
      displayName: "Coordinates",
      icon: "globe",
      description: "Coordonnées GPS",
    },
    options: {},
    attributes: {
      latitude: { type: "decimal", required: true },
      longitude: { type: "decimal", required: true },
    },
  });

  // --- schedule.opening-slot ---
  writeJSON("components/schedule/opening-slot.json", {
    collectionName: "components_schedule_opening_slot",
    info: {
      displayName: "Opening Slot",
      icon: "clock",
      description: "Créneau d'ouverture",
    },
    options: {},
    attributes: {
      dayOfWeek: {
        type: "enumeration",
        enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
        required: true,
      },
      openTime: { type: "time", required: true },
      closeTime: { type: "time", required: true },
      note: { type: "string" },
    },
  });

  // --- tutorial.step ---
  writeJSON("components/tutorial/step.json", {
    collectionName: "components_tutorial_step",
    info: {
      displayName: "Tutorial Step",
      icon: "bulletList",
      description: "Étape de tutoriel",
    },
    options: {},
    attributes: {
      order: { type: "integer", required: true },
      title: { type: "string", required: true },
      content: { type: "richtext", required: true },
      image: { type: "media", multiple: false, allowedTypes: ["images"] },
    },
  });

  // --- goal.milestone ---
  writeJSON("components/goal/milestone.json", {
    collectionName: "components_goal_milestone",
    info: {
      displayName: "Milestone",
      icon: "check",
      description: "Jalon d'objectif",
    },
    options: {},
    attributes: {
      title: { type: "string", required: true },
      isCompleted: { type: "boolean", default: false },
      completedAt: { type: "datetime" },
      note: { type: "text" },
    },
  });

  // --- assessment.dimension ---
  writeJSON("components/assessment/dimension.json", {
    collectionName: "components_assessment_dimension",
    info: {
      displayName: "Assessment Dimension",
      icon: "chartBubble",
      description: "Dimension d'évaluation",
    },
    options: {},
    attributes: {
      dimensionId: { type: "string", required: true },
      name: { type: "string", required: true },
      description: { type: "text" },
      weight: { type: "decimal", default: 1.0 },
    },
  });

  // --- assessment.question ---
  writeJSON("components/assessment/question.json", {
    collectionName: "components_assessment_question",
    info: {
      displayName: "Assessment Question",
      icon: "question",
      description: "Question d'évaluation",
    },
    options: {},
    attributes: {
      questionId: { type: "string", required: true },
      text: { type: "text", required: true },
      type: {
        type: "enumeration",
        enum: ["likert_5", "likert_7", "yes_no", "numeric", "text"],
        required: true,
      },
      dimension: { type: "string", required: true },
      order: { type: "integer", required: true },
      isRequired: { type: "boolean", default: true },
    },
  });

  // --- about.team-member ---
  writeJSON("components/about/team-member.json", {
    collectionName: "components_about_team_member",
    info: {
      displayName: "Team Member",
      icon: "user",
      description: "Membre de l'équipe",
    },
    options: {},
    attributes: {
      name: { type: "string", required: true },
      role: { type: "string" },
      bio: { type: "text" },
      photo: { type: "media", multiple: false, allowedTypes: ["images"] },
    },
  });

  // --- about.value-card ---
  writeJSON("components/about/value-card.json", {
    collectionName: "components_about_value_card",
    info: {
      displayName: "Value Card",
      icon: "star",
      description: "Carte valeur/principe",
    },
    options: {},
    attributes: {
      title: { type: "string", required: true },
      description: { type: "text", required: true },
      icon: { type: "string" },
    },
  });
}

// ============================================================================
// 2. ZONE PUBLIQUE — Collection Types
// ============================================================================

function generatePublicZone() {
  console.log("\n🌐 Génération Zone Publique...\n");

  // --- blog-article ---
  generateContentType(
    "blog-article",
    makeContentTypeSchema("blog-article", "blog-articles", "Blog Article", {
      title: { type: "string", required: true },
      slug: { type: "uid", targetField: "title", required: true },
      excerpt: { type: "text", maxLength: 160, required: true },
      content: { type: "blocks", required: true },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      category: {
        type: "relation",
        relation: "manyToOne",
        target: "api::blog-category.blog-category",
        inversedBy: "articles",
      },
      tags: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tag.tag",
        inversedBy: "blogArticles",
      },
      author: {
        type: "relation",
        relation: "manyToOne",
        target: "api::contributor-profile.contributor-profile",
        inversedBy: "authoredArticles",
      },
      status: {
        type: "enumeration",
        enum: ["draft", "in_review", "published", "archived"],
        default: "draft",
        required: true,
      },
      seoMeta: { type: "component", component: "shared.seo-meta", repeatable: false },
    }, { description: "Articles du blog" })
  );

  // --- blog-category ---
  generateContentType(
    "blog-category",
    makeContentTypeSchema("blog-category", "blog-categories", "Blog Category", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      description: { type: "text" },
      icon: { type: "string" },
      articles: {
        type: "relation",
        relation: "oneToMany",
        target: "api::blog-article.blog-article",
        mappedBy: "category",
      },
    }, { description: "Catégories du blog", draftAndPublish: false })
  );

  // --- tag ---
  generateContentType(
    "tag",
    makeContentTypeSchema("tag", "tags", "Tag", {
      name: { type: "string", unique: true, required: true },
      slug: { type: "uid", targetField: "name", required: true },
      blogArticles: {
        type: "relation",
        relation: "manyToMany",
        target: "api::blog-article.blog-article",
        mappedBy: "tags",
      },
      knowledgeBaseEntries: {
        type: "relation",
        relation: "manyToMany",
        target: "api::knowledge-base-entry.knowledge-base-entry",
        mappedBy: "tags",
      },
      tutorials: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tutorial.tutorial",
        mappedBy: "tags",
      },
      events: {
        type: "relation",
        relation: "manyToMany",
        target: "api::event.event",
        mappedBy: "tags",
      },
      newsItems: {
        type: "relation",
        relation: "manyToMany",
        target: "api::news-item.news-item",
        mappedBy: "tags",
      },
    }, { description: "Tags transversaux", draftAndPublish: false })
  );

  // --- knowledge-base-entry ---
  generateContentType(
    "knowledge-base-entry",
    makeContentTypeSchema("knowledge-base-entry", "knowledge-base-entries", "Knowledge Base Entry", {
      title: { type: "string", required: true },
      slug: { type: "uid", targetField: "title", required: true },
      content: { type: "blocks", required: true },
      category: {
        type: "relation",
        relation: "manyToOne",
        target: "api::knowledge-category.knowledge-category",
        inversedBy: "entries",
      },
      tags: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tag.tag",
        inversedBy: "knowledgeBaseEntries",
      },
      difficulty: {
        type: "enumeration",
        enum: ["beginner", "intermediate", "advanced"],
      },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      seoMeta: { type: "component", component: "shared.seo-meta", repeatable: false },
    }, { description: "Base de connaissances" })
  );

  // --- knowledge-category ---
  generateContentType(
    "knowledge-category",
    makeContentTypeSchema("knowledge-category", "knowledge-categories", "Knowledge Category", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      description: { type: "text" },
      parentCategory: {
        type: "relation",
        relation: "manyToOne",
        target: "api::knowledge-category.knowledge-category",
      },
      entries: {
        type: "relation",
        relation: "oneToMany",
        target: "api::knowledge-base-entry.knowledge-base-entry",
        mappedBy: "category",
      },
    }, { description: "Catégories de la base de connaissances", draftAndPublish: false })
  );

  // --- tutorial ---
  generateContentType(
    "tutorial",
    makeContentTypeSchema("tutorial", "tutorials", "Tutorial", {
      title: { type: "string", required: true },
      slug: { type: "uid", targetField: "title", required: true },
      description: { type: "text", required: true },
      steps: { type: "component", component: "tutorial.step", repeatable: true, required: true },
      category: {
        type: "relation",
        relation: "manyToOne",
        target: "api::knowledge-category.knowledge-category",
      },
      tags: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tag.tag",
        inversedBy: "tutorials",
      },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
    }, { description: "Tutoriels pas à pas" })
  );

  // --- structure (annuaire) ---
  generateContentType(
    "structure",
    makeContentTypeSchema("structure", "structures", "Structure", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      type: {
        type: "enumeration",
        enum: ["public", "association", "private", "community"],
        required: true,
      },
      description: { type: "blocks", required: true },
      address: { type: "component", component: "location.address", repeatable: false, required: true },
      coordinates: { type: "component", component: "location.coordinates", repeatable: false, required: true },
      phone: { type: "string" },
      email: { type: "email" },
      website: { type: "string" },
      openingHours: { type: "component", component: "schedule.opening-slot", repeatable: true },
      services: {
        type: "relation",
        relation: "manyToMany",
        target: "api::service-type.service-type",
        inversedBy: "structures",
      },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      isVerified: { type: "boolean", default: false, required: true },
      submittedBy: {
        type: "relation",
        relation: "manyToOne",
        target: "api::contributor-profile.contributor-profile",
      },
    }, { description: "Annuaire des structures" })
  );

  // --- service-type ---
  generateContentType(
    "service-type",
    makeContentTypeSchema("service-type", "service-types", "Service Type", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      icon: { type: "string" },
      structures: {
        type: "relation",
        relation: "manyToMany",
        target: "api::structure.structure",
        mappedBy: "services",
      },
    }, { description: "Types de services", draftAndPublish: false })
  );

  // --- event (agenda) ---
  generateContentType(
    "event",
    makeContentTypeSchema("event", "events", "Event", {
      title: { type: "string", required: true },
      slug: { type: "uid", targetField: "title", required: true },
      description: { type: "blocks", required: true },
      startDate: { type: "datetime", required: true },
      endDate: { type: "datetime" },
      isAllDay: { type: "boolean", default: false },
      location: { type: "component", component: "location.address", repeatable: false },
      isOnline: { type: "boolean", default: false },
      onlineLink: { type: "string" },
      eventType: {
        type: "enumeration",
        enum: ["workshop", "conference", "meetup", "support_group", "training", "other"],
        required: true,
      },
      organizer: { type: "string" },
      structure: {
        type: "relation",
        relation: "manyToOne",
        target: "api::structure.structure",
      },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      tags: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tag.tag",
        inversedBy: "events",
      },
      submittedBy: {
        type: "relation",
        relation: "manyToOne",
        target: "api::contributor-profile.contributor-profile",
      },
      status: {
        type: "enumeration",
        enum: ["draft", "in_review", "published", "cancelled"],
        default: "draft",
        required: true,
      },
    }, { description: "Événements / Agenda" })
  );

  // --- news-item ---
  generateContentType(
    "news-item",
    makeContentTypeSchema("news-item", "news-items", "News Item", {
      title: { type: "string", required: true },
      slug: { type: "uid", targetField: "title", required: true },
      excerpt: { type: "text", required: true },
      content: { type: "blocks", required: true },
      source: { type: "string" },
      coverImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      tags: {
        type: "relation",
        relation: "manyToMany",
        target: "api::tag.tag",
        inversedBy: "newsItems",
      },
    }, { description: "Actualités" })
  );
}

// ============================================================================
// 3. ZONE MEMBRE — Collection Types
// ============================================================================

function generateMemberZone() {
  console.log("\n👥 Génération Zone Membre...\n");

  // --- contributor-profile ---
  generateContentType(
    "contributor-profile",
    makeContentTypeSchema("contributor-profile", "contributor-profiles", "Contributor Profile", {
      displayName: { type: "string", required: true },
      bio: { type: "text" },
      avatar: { type: "media", multiple: false, allowedTypes: ["images"] },
      user: {
        type: "relation",
        relation: "oneToOne",
        target: "plugin::users-permissions.user",
      },
      role: {
        type: "enumeration",
        enum: ["member", "contributor", "moderator", "peer_helper"],
        default: "member",
        required: true,
      },
      contributions: {
        type: "relation",
        relation: "oneToMany",
        target: "api::contribution.contribution",
        mappedBy: "contributor",
      },
      authoredArticles: {
        type: "relation",
        relation: "oneToMany",
        target: "api::blog-article.blog-article",
        mappedBy: "author",
      },
      joinedAt: { type: "date" },
    }, { description: "Profil public du contributeur", draftAndPublish: false })
  );

  // --- contribution ---
  generateContentType(
    "contribution",
    makeContentTypeSchema("contribution", "contributions", "Contribution", {
      type: {
        type: "enumeration",
        enum: ["structure", "event", "resource", "blog_article", "correction"],
        required: true,
      },
      title: { type: "string", required: true },
      data: { type: "json", required: true },
      status: {
        type: "enumeration",
        enum: ["pending", "approved", "rejected", "revision_needed"],
        default: "pending",
        required: true,
      },
      moderationNote: { type: "text" },
      contributor: {
        type: "relation",
        relation: "manyToOne",
        target: "api::contributor-profile.contributor-profile",
        inversedBy: "contributions",
      },
      relatedContent: { type: "string" },
    }, { description: "Contributions soumises par les membres", draftAndPublish: false })
  );
}

// ============================================================================
// 4. ZONE PRIVÉE (HDS) — Collection Types
// ============================================================================

/**
 * pluginOptions pour les content-types de la zone privée.
 * Marque les champs nécessitant un chiffrement AES-256-GCM.
 */
function privatePluginOptions(encryptedFields = []) {
  return {
    "content-manager": {
      visible: true,
    },
    encryption: {
      enabled: true,
      fields: encryptedFields,
    },
  };
}

function generatePrivateZone() {
  console.log("\n🔒 Génération Zone Privée (HDS)...\n");

  // --- personal-notebook ---
  generateContentType(
    "personal-notebook",
    makeContentTypeSchema("personal-notebook", "personal-notebooks", "Personal Notebook", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      title: { type: "string", required: true },
      content: { type: "text", required: true },
      mood: {
        type: "enumeration",
        enum: ["very_bad", "bad", "neutral", "good", "very_good"],
      },
      tags: { type: "json" },
      date: { type: "date", required: true },
    }, {
      description: "Carnet de bord personnel",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["title", "content", "mood"]),
    })
  );

  // --- personal-goal ---
  generateContentType(
    "personal-goal",
    makeContentTypeSchema("personal-goal", "personal-goals", "Personal Goal", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      title: { type: "string", required: true },
      description: { type: "text" },
      horizon: {
        type: "enumeration",
        enum: ["short_term", "medium_term", "long_term"],
        required: true,
      },
      status: {
        type: "enumeration",
        enum: ["not_started", "in_progress", "completed", "abandoned"],
        default: "not_started",
        required: true,
      },
      progress: { type: "integer", min: 0, max: 100, default: 0 },
      targetDate: { type: "date" },
      milestones: { type: "component", component: "goal.milestone", repeatable: true },
    }, {
      description: "Objectifs personnels",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["title", "description", "milestones"]),
    })
  );

  // --- self-assessment ---
  generateContentType(
    "self-assessment",
    makeContentTypeSchema("self-assessment", "self-assessments", "Self Assessment", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      template: {
        type: "relation",
        relation: "manyToOne",
        target: "api::assessment-template.assessment-template",
      },
      date: { type: "datetime", required: true },
      responses: { type: "json", required: true },
      scores: { type: "json", required: true },
      globalScore: { type: "decimal" },
      personalNote: { type: "text" },
    }, {
      description: "Auto-évaluations complétées",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["responses", "scores", "globalScore", "personalNote"]),
    })
  );

  // --- assessment-template (public, pas de chiffrement) ---
  generateContentType(
    "assessment-template",
    makeContentTypeSchema("assessment-template", "assessment-templates", "Assessment Template", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      description: { type: "text", required: true },
      version: { type: "string", required: true },
      dimensions: { type: "component", component: "assessment.dimension", repeatable: true, required: true },
      questions: { type: "component", component: "assessment.question", repeatable: true, required: true },
      scoringMethod: {
        type: "enumeration",
        enum: ["sum", "average", "weighted", "custom"],
        required: true,
      },
      isActive: { type: "boolean", default: true, required: true },
    }, { description: "Modèles de questionnaires d'évaluation", draftAndPublish: false })
  );

  // --- generated-document ---
  generateContentType(
    "generated-document",
    makeContentTypeSchema("generated-document", "generated-documents", "Generated Document", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      template: {
        type: "relation",
        relation: "manyToOne",
        target: "api::document-template.document-template",
      },
      title: { type: "string", required: true },
      generatedData: { type: "json", required: true },
      pdfFile: { type: "media", multiple: false, allowedTypes: ["files"] },
      generatedAt: { type: "datetime" },
    }, {
      description: "Documents générés par les membres",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["title", "generatedData", "pdfFile"]),
    })
  );

  // --- document-template (public, pas de chiffrement) ---
  generateContentType(
    "document-template",
    makeContentTypeSchema("document-template", "document-templates", "Document Template", {
      name: { type: "string", required: true },
      slug: { type: "uid", targetField: "name", required: true },
      description: { type: "text", required: true },
      category: {
        type: "enumeration",
        enum: ["medical_report", "personal_plan", "crisis_plan", "wellness_plan", "other"],
        required: true,
      },
      fields: { type: "json", required: true },
      pdfTemplate: { type: "media", multiple: false },
      isActive: { type: "boolean", default: true, required: true },
    }, { description: "Modèles de documents", draftAndPublish: false })
  );

  // --- personal-calendar-event ---
  generateContentType(
    "personal-calendar-event",
    makeContentTypeSchema("personal-calendar-event", "personal-calendar-events", "Personal Calendar Event", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      title: { type: "string", required: true },
      description: { type: "text" },
      startDate: { type: "datetime", required: true },
      endDate: { type: "datetime" },
      isAllDay: { type: "boolean", default: false },
      eventType: {
        type: "enumeration",
        enum: ["appointment", "medication", "activity", "goal_milestone", "custom"],
      },
      reminder: { type: "json" },
      googleEventId: { type: "string" },
      recurrence: { type: "json" },
    }, {
      description: "Calendrier personnel du membre",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["title", "description"]),
    })
  );

  // --- recovery-profile ---
  generateContentType(
    "recovery-profile",
    makeContentTypeSchema("recovery-profile", "recovery-profiles", "Recovery Profile", {
      owner: {
        type: "relation",
        relation: "oneToOne",
        target: "plugin::users-permissions.user",
      },
      selfDeterminedNeeds: { type: "json" },
      strengths: { type: "json" },
      recoveryStage: {
        type: "enumeration",
        enum: ["moratorium", "awareness", "preparation", "rebuilding", "growth"],
      },
      preferences: { type: "json" },
      lastUpdated: { type: "datetime" },
    }, {
      description: "Profil de rétablissement",
      draftAndPublish: false,
      pluginOptions: privatePluginOptions(["selfDeterminedNeeds", "strengths", "recoveryStage", "preferences"]),
    })
  );

  // --- recovery-recommendation ---
  generateContentType(
    "recovery-recommendation",
    makeContentTypeSchema("recovery-recommendation", "recovery-recommendations", "Recovery Recommendation", {
      owner: {
        type: "relation",
        relation: "manyToOne",
        target: "plugin::users-permissions.user",
      },
      type: {
        type: "enumeration",
        enum: ["article", "tutorial", "event", "structure", "assessment", "goal_suggestion"],
        required: true,
      },
      targetContentType: { type: "string", required: true },
      targetContentId: { type: "integer", required: true },
      reason: { type: "text" },
      relevanceScore: { type: "decimal" },
      isViewed: { type: "boolean", default: false, required: true },
      isDismissed: { type: "boolean", default: false, required: true },
    }, { description: "Recommandations de rétablissement", draftAndPublish: false })
  );
}

// ============================================================================
// 5. SINGLE TYPES
// ============================================================================

function generateSingleTypes() {
  console.log("\n📄 Génération Single Types...\n");

  // --- homepage ---
  generateContentType(
    "homepage",
    makeContentTypeSchema("homepage", "homepages", "Homepage", {
      heroTitle: { type: "string", required: true },
      heroSubtitle: { type: "text" },
      heroImage: { type: "media", multiple: false, allowedTypes: ["images"] },
      featuredArticles: {
        type: "relation",
        relation: "oneToMany",
        target: "api::blog-article.blog-article",
      },
      featuredEvents: {
        type: "relation",
        relation: "oneToMany",
        target: "api::event.event",
      },
      ctaText: { type: "string" },
      ctaLink: { type: "string" },
    }, { kind: "singleType", description: "Page d'accueil", draftAndPublish: false })
  );

  // --- about-page ---
  generateContentType(
    "about-page",
    makeContentTypeSchema("about-page", "about-pages", "About Page", {
      title: { type: "string", required: true },
      content: { type: "blocks", required: true },
      teamMembers: { type: "component", component: "about.team-member", repeatable: true },
      values: { type: "component", component: "about.value-card", repeatable: true },
    }, { kind: "singleType", description: "Page À propos", draftAndPublish: false })
  );

  // --- platform-settings ---
  generateContentType(
    "platform-setting",
    makeContentTypeSchema("platform-setting", "platform-settings", "Platform Settings", {
      siteName: { type: "string", required: true },
      siteDescription: { type: "text" },
      logo: { type: "media", multiple: false, allowedTypes: ["images"] },
      favicon: { type: "media", multiple: false, allowedTypes: ["images"] },
      maintenanceMode: { type: "boolean", default: false },
      defaultAssessmentTemplate: {
        type: "relation",
        relation: "oneToOne",
        target: "api::assessment-template.assessment-template",
      },
      googleCalendarClientId: { type: "string" },
    }, { kind: "singleType", description: "Paramètres de la plateforme", draftAndPublish: false })
  );
}

// ============================================================================
// 6. MIDDLEWARE DE CHIFFREMENT (squelette)
// ============================================================================

function generateEncryptionMiddleware() {
  console.log("\n🔐 Génération du middleware de chiffrement...\n");

  const middlewareCode = `'use strict';

/**
 * ============================================================================
 * ENCRYPTION MIDDLEWARE — AES-256-GCM
 * ============================================================================
 *
 * Ce middleware intercepte les opérations CRUD sur les content-types de la
 * zone privée pour chiffrer/déchiffrer les champs sensibles.
 *
 * PRÉREQUIS :
 *   - Variable d'environnement ENCRYPTION_KEY (clé 256 bits en hex ou base64)
 *   - Optionnel : intégration avec un KMS (AWS KMS, HashiCorp Vault, etc.)
 *
 * INSTALLATION :
 *   Importer dans src/index.js :
 *   \`\`\`
 *   const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');
 *   module.exports = {
 *     bootstrap({ strapi }) {
 *       registerEncryptionLifecycles(strapi);
 *     },
 *   };
 *   \`\`\`
 */

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const KEY_VERSION = 'v1';    // Pour la rotation des clés

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement.
 * En production, utiliser un KMS (AWS KMS, HashiCorp Vault, etc.)
 */
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      '[Encryption] ENCRYPTION_KEY non définie. ' +
      'Générez-en une avec: node -e "console.log(require(\\'crypto\\').randomBytes(32).toString(\\'hex\\'))"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

// ---------------------------------------------------------------------------
// Chiffrement / Déchiffrement
// ---------------------------------------------------------------------------

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const stringValue = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  let encrypted = cipher.update(stringValue, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format : version:iv:authTag:ciphertext (tout en base64)
  return [
    KEY_VERSION,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

function decrypt(encryptedValue) {
  if (encryptedValue === null || encryptedValue === undefined) return encryptedValue;
  if (typeof encryptedValue !== 'string' || !encryptedValue.includes(':')) return encryptedValue;

  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 4) return encryptedValue;

    const [version, ivB64, authTagB64, ciphertext] = parts;
    // TODO : gérer la rotation des clés basée sur 'version'

    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Tenter de parser en JSON si applicable
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    strapi.log.error('[Encryption] Erreur de déchiffrement:', err.message);
    return encryptedValue;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle Hooks
// ---------------------------------------------------------------------------

/**
 * Récupère la liste des champs chiffrés depuis le schema du content-type.
 */
function getEncryptedFields(uid) {
  const contentType = strapi.contentTypes[uid];
  if (!contentType) return [];

  const encryptionConfig = contentType.pluginOptions?.encryption;
  if (!encryptionConfig?.enabled) return [];

  return encryptionConfig.fields || [];
}

/**
 * Chiffre les champs spécifiés dans les données.
 */
function encryptFields(data, fields) {
  if (!data) return data;
  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}

/**
 * Déchiffre les champs spécifiés dans les données.
 */
function decryptFields(data, fields) {
  if (!data) return data;
  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }
  return decrypted;
}

/**
 * Déchiffre récursivement (pour les résultats paginés ou les arrays).
 */
function decryptResult(result, fields) {
  if (!result) return result;

  if (Array.isArray(result)) {
    return result.map((item) => decryptFields(item, fields));
  }

  if (result.results && Array.isArray(result.results)) {
    result.results = result.results.map((item) => decryptFields(item, fields));
    return result;
  }

  return decryptFields(result, fields);
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Enregistre les lifecycle hooks de chiffrement pour tous les content-types
 * de la zone privée.
 */
function registerEncryptionLifecycles(strapi) {
  const privateContentTypes = [
    'api::personal-notebook.personal-notebook',
    'api::personal-goal.personal-goal',
    'api::self-assessment.self-assessment',
    'api::generated-document.generated-document',
    'api::personal-calendar-event.personal-calendar-event',
    'api::recovery-profile.recovery-profile',
  ];

  for (const uid of privateContentTypes) {
    const fields = getEncryptedFields(uid);
    if (fields.length === 0) continue;

    strapi.log.info(\`[Encryption] Chiffrement activé pour \${uid} — champs: \${fields.join(', ')}\`);

    strapi.db.lifecycles.subscribe({
      models: [uid],

      async beforeCreate(event) {
        event.params.data = encryptFields(event.params.data, fields);
      },

      async beforeUpdate(event) {
        if (event.params.data) {
          event.params.data = encryptFields(event.params.data, fields);
        }
      },

      async afterFind(event) {
        event.result = decryptResult(event.result, fields);
      },

      async afterFindOne(event) {
        if (event.result) {
          event.result = decryptFields(event.result, fields);
        }
      },
    });
  }
}

module.exports = {
  encrypt,
  decrypt,
  registerEncryptionLifecycles,
};
`;
  writeFile("extensions/encryption/lifecycle.js", middlewareCode);

  // --- Owner policy (sécurité zone privée) ---
  const ownerPolicyCode = `'use strict';

/**
 * ============================================================================
 * OWNER POLICY — Restriction d'accès aux données personnelles
 * ============================================================================
 *
 * Cette policy s'assure qu'un utilisateur authentifié ne peut accéder
 * qu'à ses propres données dans la zone privée.
 *
 * Usage dans les routes :
 *   config: { policies: ['global::is-owner'] }
 */

module.exports = async (policyContext, config, { strapi }) => {
  const { state, params } = policyContext;

  // L'utilisateur doit être authentifié
  if (!state.user) {
    return false;
  }

  // Pour les requêtes find/findOne, on filtre par owner
  if (policyContext.request.method === 'GET') {
    // Ajouter un filtre owner automatiquement
    if (!policyContext.request.query.filters) {
      policyContext.request.query.filters = {};
    }
    policyContext.request.query.filters.owner = state.user.id;
    return true;
  }

  // Pour create, on force le owner
  if (policyContext.request.method === 'POST') {
    if (policyContext.request.body?.data) {
      policyContext.request.body.data.owner = state.user.id;
    }
    return true;
  }

  // Pour update/delete, vérifier que l'entrée appartient à l'utilisateur
  if (['PUT', 'DELETE'].includes(policyContext.request.method) && params.id) {
    const contentType = policyContext.state.route?.info?.apiName;
    if (!contentType) return false;

    const uid = \`api::\${contentType}.\${contentType}\`;
    const entry = await strapi.entityService.findOne(uid, params.id, {
      fields: ['id'],
      populate: { owner: { fields: ['id'] } },
    });

    if (!entry || entry.owner?.id !== state.user.id) {
      return false;
    }
    return true;
  }

  return false;
};
`;
  writeFile("policies/is-owner.js", ownerPolicyCode);
}

// ============================================================================
// 7. BOOTSTRAP (src/index.js)
// ============================================================================

function generateBootstrap() {
  console.log("\n🚀 Génération du bootstrap (src/index.js)...\n");

  const indexCode = `'use strict';

const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');

module.exports = {
  /**
   * Appelé au démarrage de Strapi.
   */
  async bootstrap({ strapi }) {
    // Enregistrer le middleware de chiffrement pour la zone privée
    registerEncryptionLifecycles(strapi);

    strapi.log.info('[Bootstrap] Chiffrement des données de santé activé');
  },

  /**
   * Appelé lors de l'enregistrement des middlewares/plugins.
   */
  register({ strapi }) {
    // Possibilité d'ajouter des middlewares personnalisés ici
  },
};
`;
  writeFile("index.js", indexCode);
}

// ============================================================================
// 8. SQL pour schéma privé PostgreSQL
// ============================================================================

function generateSQLMigration() {
  console.log("\n🗄️  Génération du script SQL...\n");

  const sql = `-- ============================================================================
-- MIGRATION : Création du schéma privé pour les données de santé (HDS)
-- ============================================================================
-- À exécuter AVANT le premier démarrage de Strapi
-- Adapter les noms d'utilisateur PostgreSQL selon votre configuration

-- 1. Créer le schéma isolé
CREATE SCHEMA IF NOT EXISTS private_health;

-- 2. Créer un rôle applicatif dédié (si pas déjà fait)
-- CREATE ROLE strapi_app_user WITH LOGIN PASSWORD 'CHANGE_ME';

-- 3. Accorder les permissions minimales
GRANT USAGE ON SCHEMA private_health TO strapi_app_user;
GRANT CREATE ON SCHEMA private_health TO strapi_app_user;
REVOKE ALL ON SCHEMA private_health FROM PUBLIC;

-- 4. Permissions par défaut sur les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA private_health
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO strapi_app_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA private_health
  GRANT USAGE, SELECT ON SEQUENCES TO strapi_app_user;

-- 5. Activer le chiffrement au repos PostgreSQL (optionnel, complémentaire)
-- Note : Le chiffrement applicatif (AES-256-GCM) est la couche principale.
-- Le TDE (Transparent Data Encryption) est une couche supplémentaire.
-- Consultez la documentation de votre hébergeur HDS pour la configuration.

-- ============================================================================
-- NOTES
-- ============================================================================
-- Les tables Strapi de la zone privée (personal_notebooks, personal_goals,
-- self_assessments, etc.) seront créées automatiquement par Strapi au
-- démarrage. Le chiffrement des champs se fait au niveau applicatif
-- (middleware lifecycle hooks), pas au niveau SQL.
--
-- Pour une isolation complète, configurez DATABASE_SCHEMA=private_health
-- dans les variables d'environnement de Strapi pour les content-types privés,
-- ou utilisez une base de données PostgreSQL séparée.
`;
  writeFile("../database/migrations/001_create_private_schema.sql", sql);
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║          STRAPI SCHEMA GENERATOR                           ║");
  console.log("║          Modélisation complète — 3 zones                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`\n📁 Répertoire de sortie : ${path.resolve(OUTPUT_DIR)}`);
  if (dryRun) console.log("⚠️  Mode DRY-RUN activé (aucun fichier créé)\n");

  generateComponents();
  generatePublicZone();
  generateMemberZone();
  generatePrivateZone();
  generateSingleTypes();
  generateEncryptionMiddleware();
  generateBootstrap();
  generateSQLMigration();

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ✅ Génération terminée !                                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log(`
📋 Prochaines étapes :
  1. Copiez le dossier 'src/' à la racine de votre projet Strapi
  2. Exécutez le script SQL : database/migrations/001_create_private_schema.sql
  3. Définissez la variable d'environnement ENCRYPTION_KEY :
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  4. Redémarrez Strapi : npm run develop
  5. Vérifiez les content-types dans le Content-Type Builder

⚠️  Rappels importants :
  - Ne commitez JAMAIS la clé de chiffrement dans le code source
  - Configurez un KMS en production (AWS KMS, Vault, etc.)
  - Les données de la zone privée nécessitent un hébergement HDS
  `);
}

main();
