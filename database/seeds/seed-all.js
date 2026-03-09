'use strict';

/**
 * Seed complet — Pairemancipation
 *
 * Injecte des données de démonstration dans TOUS les outils et modules
 * pour rendre l'ensemble des fonctionnalités visibles et utilisables.
 *
 * Contenu public :
 *   - Homepage, About page, Platform settings
 *   - Tutoriels, modèles de documents
 *   - Profils communautaires, communauté, groupes
 *   - Profils contributeurs
 *
 * Contenu privé (pour l'utilisateur démo) :
 *   - Profil de rétablissement (recovery-profile)
 *   - Profil autodéterminé (self-determined-profile)
 *   - Objectifs personnels (personal-goal)
 *   - Journal de bord (personal-notebook)
 *   - Événements du calendrier (personal-calendar-event)
 *   - Signaux avant-coureurs (early-warning-sign)
 *   - Observations de situation (situation-observation)
 *   - Thésaurus de situations (situation-thesaurus)
 *   - Objectifs de situation (situation-objective)
 *   - Résolution de problèmes (self-problem-solving)
 *   - Auto-évaluations (self-assessment)
 *   - Recommandations (recovery-recommendation)
 *   - Suivi du rétablissement (recovery-tracking)
 *   - Documents générés (generated-document)
 *   - Modèles de documents (document-template)
 *
 * Usage :
 *   npm run seed:all --workspace=apps/backend
 *
 * Prérequis :
 *   - Lancer d'abord `npm run seed` pour créer les données de base
 *   - Puis `npm run seed:wellness` pour les check-ins
 *   - Puis `npm run seed:all` pour compléter avec tout le reste
 */

require('dotenv').config();
const { createStrapi } = require('@strapi/strapi');

const TARGET_EMAIL = process.env.SEED_DEMO_EMAIL || process.env.SEED_WELLNESS_EMAIL || 'agathe@next-impact.digital';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function datetimeAgo(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function datetimeFromNow(n, hour = 10) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function blocksText(text) {
  return [{ type: 'paragraph', children: [{ type: 'text', text }] }];
}

async function findOrSkip(strapi, uid, filters) {
  const existing = await strapi.documents(uid).findMany({ filters, limit: 1 });
  return existing.length > 0 ? existing[0] : null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedAll() {
  console.log('🌱 Seed complet — Pairemancipation\n');

  const appContext = await createStrapi({ distDir: './dist' }).load();
  const strapi = appContext;

  // --- Trouver l'utilisateur démo ---
  const user = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({ where: { email: TARGET_EMAIL } });

  if (!user) {
    console.error(`❌ Utilisateur non trouvé : ${TARGET_EMAIL}`);
    console.error('   Lancez d\'abord : npm run seed --workspace=apps/backend');
    await strapi.destroy();
    process.exit(1);
  }

  console.log(`👤 Utilisateur cible : ${user.username} (${user.email}, id: ${user.id})\n`);

  // =====================================================================
  // CONTENU PUBLIC
  // =====================================================================

  // --- Homepage ---
  await seedHomepage(strapi);

  // --- About Page ---
  await seedAboutPage(strapi);

  // --- Platform Settings ---
  await seedPlatformSettings(strapi);

  // --- Tutorials ---
  await seedTutorials(strapi);

  // --- Document Templates ---
  await seedDocumentTemplates(strapi);

  // --- Contributor Profile ---
  const contributorProfile = await seedContributorProfile(strapi, user);

  // --- Community Profile ---
  const communityProfile = await seedCommunityProfile(strapi, user);

  // --- Community ---
  await seedCommunity(strapi, communityProfile);

  // =====================================================================
  // CONTENU PRIVÉ (utilisateur démo)
  // =====================================================================

  // --- Recovery Profile ---
  await seedRecoveryProfile(strapi, user);

  // --- Self-Determined Profile ---
  await seedSelfDeterminedProfile(strapi, user);

  // --- Early Warning Signs ---
  await seedEarlyWarningSigns(strapi, user);

  // --- Situation Thesaurus ---
  await seedSituationThesaurus(strapi, user);

  // --- Situation Observations ---
  const observations = await seedSituationObservations(strapi, user);

  // --- Situation Objectives ---
  await seedSituationObjectives(strapi, user, observations);

  // --- Personal Goals ---
  await seedPersonalGoals(strapi, user);

  // --- Self Problem Solving ---
  await seedSelfProblemSolving(strapi, user);

  // --- Personal Notebook ---
  await seedPersonalNotebook(strapi, user);

  // --- Personal Calendar Events ---
  await seedPersonalCalendarEvents(strapi, user);

  // --- Self Assessments ---
  await seedSelfAssessments(strapi, user);

  // --- Recovery Recommendations ---
  await seedRecoveryRecommendations(strapi, user);

  // --- Generated Documents ---
  await seedGeneratedDocuments(strapi, user);

  // --- Recovery Tracking ---
  await seedRecoveryTracking(strapi, user);

  // =====================================================================

  console.log('\n🎉 Seed complet terminé avec succès !');
  console.log('   Toutes les fonctionnalités sont maintenant visibles et utilisables.');

  await strapi.destroy();
  process.exit(0);
}

// =====================================================================
// PUBLIC CONTENT SEEDERS
// =====================================================================

async function seedHomepage(strapi) {
  console.log('🏠 Homepage...');
  try {
    const existing = await strapi.documents('api::homepage.homepage').findFirst();
    if (existing) {
      console.log('   ⏭  Existe déjà');
      return;
    }
    await strapi.documents('api::homepage.homepage').create({
      data: {
        heroTitle: 'Bienvenue sur Pairemancipation',
        heroSubtitle: 'Votre plateforme de pair-accompagnement en santé mentale',
        heroDescription: blocksText(
          'Pairemancipation est un espace dédié au rétablissement en santé mentale. ' +
          'Découvrez des outils personnalisés, une communauté bienveillante et des ressources ' +
          'pour vous accompagner dans votre parcours.'
        ),
        ctaText: 'Commencer mon parcours',
        ctaLink: '/inscription',
      },
    });
    console.log('   ✅ Créée');
  } catch {
    console.log('   ⏭  Ignoré (singleType probablement existant)');
  }
}

async function seedAboutPage(strapi) {
  console.log('📄 Page À propos...');
  try {
    const existing = await strapi.documents('api::about-page.about-page').findFirst();
    if (existing) {
      console.log('   ⏭  Existe déjà');
      return;
    }
    await strapi.documents('api::about-page.about-page').create({
      data: {
        title: 'À propos de Pairemancipation',
        content: [
          { type: 'paragraph', children: [{ type: 'text', text: 'Pairemancipation est une plateforme numérique dédiée au rétablissement en santé mentale, fondée sur les principes de la pair-aidance et de l\'autodétermination.' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'Notre mission est de fournir des outils accessibles et personnalisés pour accompagner chaque personne dans son parcours de rétablissement, tout en favorisant l\'entraide et la communauté.' }] },
          { type: 'paragraph', children: [{ type: 'text', text: 'La plateforme s\'appuie sur des modèles validés scientifiquement, comme le modèle STORI de rétablissement, la Fleur de Patricia, et l\'échelle RAS-r.' }] },
        ],
      },
    });
    console.log('   ✅ Créée');
  } catch {
    console.log('   ⏭  Ignoré');
  }
}

async function seedPlatformSettings(strapi) {
  console.log('⚙️  Platform Settings...');
  try {
    const existing = await strapi.documents('api::platform-setting.platform-setting').findFirst();
    if (existing) {
      console.log('   ⏭  Existe déjà');
      return;
    }
    await strapi.documents('api::platform-setting.platform-setting').create({
      data: {
        siteName: 'Pairemancipation',
        siteDescription: 'Plateforme de pair-accompagnement en santé mentale',
        maintenanceMode: false,
      },
    });
    console.log('   ✅ Créé');
  } catch {
    console.log('   ⏭  Ignoré');
  }
}

async function seedTutorials(strapi) {
  console.log('📖 Tutoriels...');

  const tutorials = [
    {
      title: 'Premiers pas sur Pairemancipation',
      slug: 'premiers-pas',
      description: 'Découvrez comment utiliser la plateforme et ses outils pour votre parcours de rétablissement.',
      steps: [
        { order: 1, title: 'Créer votre compte', content: 'Inscrivez-vous sur la plateforme avec votre adresse email. Vous recevrez un email de confirmation.' },
        { order: 2, title: 'Compléter Le Chemin', content: 'Répondez aux questions du Chemin pour que la plateforme puisse personnaliser votre expérience.' },
        { order: 3, title: 'Découvrir les outils', content: 'Explorez les différentes sections : Se connaître, Agir et Gérer. Chaque outil est conçu pour vous accompagner.' },
      ],
    },
    {
      title: 'Comprendre le Chemin',
      slug: 'comprendre-le-chemin',
      description: 'Guide complet pour naviguer dans les 7 Caps du Chemin et comprendre chaque étape.',
      steps: [
        { order: 1, title: 'La Boussole du Bien-Être', content: 'Définissez ce que le rétablissement signifie pour vous, vos buts et vos besoins essentiels.' },
        { order: 2, title: 'Identification des Forces', content: 'Identifiez vos qualités, vos forces et les activités qui vous enrichissent.' },
        { order: 3, title: 'Vulnérabilités et Équilibre', content: 'Explorez vos déclencheurs, vos difficultés quotidiennes et vos stratégies d\'auto-soin.' },
        { order: 4, title: 'Évaluation Fonctionnelle', content: 'Évaluez vos besoins en termes de planification, rappels et découpage de problèmes.' },
      ],
    },
    {
      title: 'Utiliser le Décodeur de Situations',
      slug: 'utiliser-decodeur-situations',
      description: 'Apprenez à identifier vos déclencheurs et à décoder vos réactions avec le Décodeur.',
      steps: [
        { order: 1, title: 'Observer la situation', content: 'Décrivez la situation déclencheuse : que s\'est-il passé ? Quel type de déclencheur ?' },
        { order: 2, title: 'Évaluer l\'intensité', content: 'Notez l\'intensité de votre réaction sur une échelle de 1 à 10.' },
        { order: 3, title: 'Décoder vos réactions', content: 'Identifiez vos pensées, émotions, sensations physiques et comportements associés.' },
        { order: 4, title: 'Définir un objectif', content: 'Créez un objectif concret pour mieux gérer cette situation à l\'avenir.' },
      ],
    },
    {
      title: 'Tenir son Carnet de Bord',
      slug: 'tenir-son-carnet-de-bord',
      description: 'Conseils pour utiliser le journal de bord comme outil de connaissance de soi.',
      steps: [
        { order: 1, title: 'Écrire régulièrement', content: 'Prenez quelques minutes chaque jour pour écrire. Même quelques mots suffisent.' },
        { order: 2, title: 'Noter votre humeur', content: 'Associez une humeur à chaque entrée pour suivre votre état émotionnel dans le temps.' },
        { order: 3, title: 'Utiliser les tags', content: 'Ajoutez des tags (travail, social, santé...) pour retrouver et analyser vos entrées plus facilement.' },
      ],
    },
    {
      title: 'L\'Atelier des Solutions',
      slug: 'atelier-des-solutions',
      description: 'Résolvez vos problèmes étape par étape avec l\'Atelier des Solutions.',
      steps: [
        { order: 1, title: 'Définir le problème', content: 'Reformulez votre défi, décrivez la situation et fixez un objectif clair.' },
        { order: 2, title: 'Explorer les solutions', content: 'Faites un brainstorming d\'idées, analysez les avantages et inconvénients de chacune.' },
        { order: 3, title: 'Passer à l\'action', content: 'Choisissez une solution, planifiez les étapes concrètes et anticipez les obstacles.' },
        { order: 4, title: 'Évaluer les résultats', content: 'Après avoir agi, faites le bilan : qu\'est-ce qui a marché ? Que faut-il ajuster ?' },
      ],
    },
  ];

  for (const tuto of tutorials) {
    const existing = await strapi.documents('api::tutorial.tutorial').findFirst({
      filters: { slug: tuto.slug },
    });
    if (existing) {
      console.log(`   ⏭  ${tuto.title} (existe déjà)`);
    } else {
      await strapi.documents('api::tutorial.tutorial').create({
        data: tuto,
        status: 'published',
      });
      console.log(`   ✅ ${tuto.title}`);
    }
  }
}

async function seedDocumentTemplates(strapi) {
  console.log('📋 Modèles de documents...');

  const templates = [
    {
      name: 'Plan de crise personnalisé',
      slug: 'plan-de-crise',
      description: 'Document personnalisé regroupant vos signaux d\'alerte, contacts d\'urgence et stratégies d\'adaptation.',
      category: 'crisis_plan',
      fields: [
        { key: 'earlyWarningSigns', label: 'Signaux avant-coureurs', type: 'list' },
        { key: 'copingStrategies', label: 'Stratégies d\'adaptation', type: 'list' },
        { key: 'emergencyContacts', label: 'Contacts d\'urgence', type: 'contacts' },
        { key: 'safeActions', label: 'Actions sécurisantes', type: 'list' },
      ],
    },
    {
      name: 'Bilan de rétablissement',
      slug: 'bilan-retablissement',
      description: 'Synthèse de votre parcours de rétablissement avec scores, évolution et recommandations.',
      category: 'wellness_plan',
      fields: [
        { key: 'recoveryStage', label: 'Stade de rétablissement', type: 'text' },
        { key: 'scores', label: 'Scores par module', type: 'object' },
        { key: 'strengths', label: 'Points forts', type: 'list' },
        { key: 'goals', label: 'Objectifs en cours', type: 'list' },
      ],
    },
    {
      name: 'Mon plan personnel',
      slug: 'plan-personnel',
      description: 'Plan d\'action personnel regroupant vos objectifs, jalons et facilitateurs.',
      category: 'personal_plan',
      fields: [
        { key: 'goals', label: 'Objectifs', type: 'list' },
        { key: 'milestones', label: 'Jalons', type: 'list' },
        { key: 'facilitators', label: 'Facilitateurs', type: 'list' },
        { key: 'barriers', label: 'Obstacles identifiés', type: 'list' },
      ],
    },
  ];

  for (const tpl of templates) {
    const existing = await strapi.documents('api::document-template.document-template').findFirst({
      filters: { slug: tpl.slug },
    });
    if (existing) {
      console.log(`   ⏭  ${tpl.name} (existe déjà)`);
    } else {
      await strapi.documents('api::document-template.document-template').create({
        data: { ...tpl, isActive: true },
      });
      console.log(`   ✅ ${tpl.name}`);
    }
  }
}

async function seedContributorProfile(strapi, user) {
  console.log('👤 Profil contributeur...');
  const existing = await findOrSkip(strapi, 'api::contributor-profile.contributor-profile', { user: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return existing;
  }
  const profile = await strapi.documents('api::contributor-profile.contributor-profile').create({
    data: {
      displayName: user.username,
      bio: 'Pair-aidant en formation, passionné par le rétablissement et l\'entraide.',
      user: user.id,
      role: 'contributor',
      joinedAt: daysAgo(90),
    },
  });
  console.log('   ✅ Créé');
  return profile;
}

async function seedCommunityProfile(strapi, user) {
  console.log('🌐 Profil communautaire...');
  const existing = await findOrSkip(strapi, 'api::community-profile.community-profile', { user: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return existing;
  }

  const tags = await strapi.documents('api::tag.tag').findMany({ limit: 3 });
  const tagIds = tags.map(t => t.documentId);

  const profile = await strapi.documents('api::community-profile.community-profile').create({
    data: {
      user: user.id,
      pseudonym: 'Voyageur_' + user.id,
      bio: 'En chemin vers le rétablissement. J\'aime partager et apprendre des autres.',
      recoveryTags: tagIds,
      isCompanion: false,
      contactPreference: 'platform_message',
      isVisible: true,
      joinedAt: daysAgo(60),
    },
  });
  console.log('   ✅ Créé');
  return profile;
}

async function seedCommunity(strapi, communityProfile) {
  console.log('🏘  Communauté...');
  const existing = await strapi.documents('api::community.community').findFirst({
    filters: { slug: 'communaute-retablissement' },
  });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return;
  }

  if (!communityProfile) {
    console.log('   ⏭  Pas de profil communautaire');
    return;
  }

  await strapi.documents('api::community.community').create({
    data: {
      name: 'Communauté du Rétablissement',
      slug: 'communaute-retablissement',
      description: 'Espace d\'échange et de partage pour les personnes en parcours de rétablissement.',
      members: [communityProfile.documentId],
      admins: [communityProfile.documentId],
    },
  });
  console.log('   ✅ Créée');
}

// =====================================================================
// PRIVATE CONTENT SEEDERS
// =====================================================================

async function seedRecoveryProfile(strapi, user) {
  console.log('🌿 Profil de rétablissement...');
  const existing = await findOrSkip(strapi, 'api::recovery-profile.recovery-profile', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return;
  }

  await strapi.documents('api::recovery-profile.recovery-profile').create({
    data: {
      owner: user.id,
      recoveryStage: 'preparation',
      crisisPlanStatus: 'green',
      selfDeterminedNeeds: ['Stabilité émotionnelle', 'Lien social', 'Activité physique régulière'],
      strengths: ['Persévérance', 'Créativité', 'Empathie', 'Curiosité'],
      preferences: { communication: 'écrite', rythme: 'progressif' },
      wellnessDefinition: 'Pouvoir vivre des journées paisibles, avoir des projets qui me motivent et me sentir entouré(e) de personnes bienveillantes.',
      dreams: ['Devenir pair-aidant', 'Reprendre une activité artistique', 'Voyager'],
      emergencyContacts: [
        { name: 'Dr Martin', phone: '01 42 00 00 00', role: 'Psychiatre' },
        { name: 'SOS Amitié', phone: '09 72 39 40 50', role: 'Écoute' },
        { name: 'Marie', phone: '06 12 34 56 78', role: 'Amie proche' },
      ],
      copingStrategies: [
        'Marcher dans la nature',
        'Écrire dans mon journal',
        'Appeler un ami',
        'Respiration carrée (4-4-4-4)',
        'Écouter de la musique apaisante',
      ],
      lastUpdated: new Date().toISOString(),
    },
  });
  console.log('   ✅ Créé');
}

async function seedSelfDeterminedProfile(strapi, user) {
  console.log('🧭 Profil autodéterminé (Le Chemin)...');
  const existing = await findOrSkip(strapi, 'api::self-determined-profile.self-determined-profile', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return;
  }

  await strapi.documents('api::self-determined-profile.self-determined-profile').create({
    data: {
      owner: user.id,
      wellnessCompass: {
        recoveryMeaning: 'Retrouver une vie qui a du sens, même avec mes fragilités. Pouvoir contribuer à la société et me sentir utile.',
        threeGoals: ['Trouver un emploi adapté', 'Créer des liens sociaux durables', 'Prendre soin de ma santé physique'],
        threeEssentialNeeds: ['Sécurité émotionnelle', 'Reconnaissance', 'Autonomie'],
        prioritySpheres: ['health', 'relationships', 'work', 'self_esteem'],
      },
      strengthsIdentification: {
        threeQualities: ['Je suis à l\'écoute des autres', 'Je suis créatif/ve', 'Je suis déterminé(e)'],
        threeStrengths: ['Je reste debout malgré les épreuves', 'Je sais demander de l\'aide', 'Je m\'adapte aux changements'],
        twoEnrichingActivities: ['La peinture', 'Les promenades en forêt'],
      },
      vulnerabilitiesBalance: {
        extremeTriggers: 'Le sentiment d\'isolement prolongé et la surcharge de sollicitations sociales',
        threeDailyDifficulties: ['Gérer mon énergie au quotidien', 'Maintenir un sommeil régulier', 'Faire face aux pensées négatives'],
        threeSelfCareActions: ['Méditer 10 minutes', 'Marcher dehors', 'Appeler un proche'],
        hopeContacts: ['Marie (amie)', 'Dr Martin', 'Le GEM'],
      },
      functionalAssessment: {
        timeLossFrequency: 'sometimes',
        planningDifficulty: 'sometimes',
        needsReminders: true,
        needsProblemSlicing: true,
      },
      stabilityLevel: 'stabilizing',
      suggestedModules: ['conscience_regulation', 'capitaine_action', 'resilience_quotidien'],
      onboardingCompletedAt: datetimeAgo(30),
      lastUpdated: new Date().toISOString(),
    },
  });
  console.log('   ✅ Créé');
}

async function seedEarlyWarningSigns(strapi, user) {
  console.log('🚨 Signaux avant-coureurs...');
  const existing = await findOrSkip(strapi, 'api::early-warning-sign.early-warning-sign', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return;
  }

  await strapi.documents('api::early-warning-sign.early-warning-sign').create({
    data: {
      owner: user.id,
      signs: [
        { id: 'sign-1', label: 'Insomnie pendant plus de 3 nuits consécutives', action: 'Prendre rendez-vous avec le psychiatre', isActive: true, createdAt: datetimeAgo(20) },
        { id: 'sign-2', label: 'Envie de m\'isoler complètement', action: 'Appeler Marie ou aller au GEM', isActive: true, createdAt: datetimeAgo(20) },
        { id: 'sign-3', label: 'Pensées négatives en boucle le matin', action: 'Faire ma séance de méditation + écrire dans le journal', isActive: true, createdAt: datetimeAgo(18) },
        { id: 'sign-4', label: 'Augmentation de la consommation de tabac', action: 'Identifier le stress et utiliser la respiration carrée', isActive: true, createdAt: datetimeAgo(15) },
        { id: 'sign-5', label: 'Perte d\'appétit pendant plus de 2 jours', action: 'En parler à mon médecin traitant', isActive: true, createdAt: datetimeAgo(10) },
        { id: 'sign-6', label: 'Irritabilité inhabituelle avec les proches', action: 'Prendre du recul, sortir marcher, puis en parler calmement', isActive: false, createdAt: datetimeAgo(5) },
      ],
    },
  });
  console.log('   ✅ Créés (6 signaux)');
}

async function seedSituationThesaurus(strapi, user) {
  console.log('📚 Thésaurus de situations...');
  const existing = await findOrSkip(strapi, 'api::situation-thesaurus.situation-thesaurus', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existe déjà');
    return;
  }

  await strapi.documents('api::situation-thesaurus.situation-thesaurus').create({
    data: {
      owner: user.id,
      categories: ['Travail', 'Relations', 'Santé', 'Quotidien', 'Administratif'],
      thoughts: [
        'Je ne suis pas à la hauteur',
        'Personne ne me comprend',
        'Ça ne va jamais s\'arranger',
        'C\'est de ma faute',
        'Je peux y arriver',
        'Ce n\'est qu\'un mauvais moment',
      ],
      emotions: [
        'Anxiété',
        'Tristesse',
        'Colère',
        'Frustration',
        'Espoir',
        'Soulagement',
        'Fierté',
        'Culpabilité',
      ],
      sensations: [
        'Nœud à l\'estomac',
        'Tension dans la mâchoire',
        'Palpitations',
        'Mains moites',
        'Fatigue soudaine',
        'Oppression thoracique',
      ],
      behaviors: [
        'Évitement',
        'Rumination',
        'Retrait social',
        'Suralimentation',
        'Agitation',
        'Respiration profonde',
        'Marche',
      ],
    },
  });
  console.log('   ✅ Créé');
}

async function seedSituationObservations(strapi, user) {
  console.log('🔍 Observations de situation...');
  const existing = await findOrSkip(strapi, 'api::situation-observation.situation-observation', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return [];
  }

  const observations = [
    {
      date: datetimeAgo(12, 9),
      category: 'Travail',
      triggerDescription: 'Réunion imprévue avec mon responsable qui m\'a demandé un compte-rendu pour le lendemain.',
      triggerType: 'exposition',
      intensity: 7,
      thoughts: { text: 'Je ne vais pas y arriver à temps, je suis nul(le).', tags: ['Je ne suis pas à la hauteur'] },
      emotions: { text: 'Forte anxiété et panique', tags: ['Anxiété', 'Frustration'] },
      sensations: { text: 'Palpitations, mains moites, nœud à l\'estomac', tags: ['Palpitations', 'Mains moites', 'Nœud à l\'estomac'] },
      behaviors: { text: 'J\'ai fait une pause dehors pour respirer avant de m\'y mettre.', tags: ['Respiration profonde'] },
    },
    {
      date: datetimeAgo(8, 14),
      category: 'Relations',
      triggerDescription: 'Un ami a annulé notre sortie au dernier moment sans explication.',
      triggerType: 'exposition',
      intensity: 6,
      thoughts: { text: 'Il ne veut plus me voir, je suis un poids pour les autres.', tags: ['Personne ne me comprend'] },
      emotions: { text: 'Tristesse et sentiment de rejet', tags: ['Tristesse', 'Culpabilité'] },
      sensations: { text: 'Fatigue soudaine, envie de pleurer', tags: ['Fatigue soudaine'] },
      behaviors: { text: 'Je me suis isolé(e) le reste de la journée.', tags: ['Retrait social', 'Rumination'] },
    },
    {
      date: datetimeAgo(5, 8),
      category: 'Santé',
      triggerDescription: 'Pensée matinale anticipatoire : « Et si je faisais une rechute ? »',
      triggerType: 'anticipatory_thought',
      intensity: 5,
      thoughts: { text: 'La peur de replonger est très présente ce matin.', tags: ['Ça ne va jamais s\'arranger'] },
      emotions: { text: 'Anxiété modérée', tags: ['Anxiété'] },
      sensations: { text: 'Tension dans la mâchoire', tags: ['Tension dans la mâchoire'] },
      behaviors: { text: 'Méditation de 10 minutes puis écriture dans le journal.', tags: ['Respiration profonde'] },
    },
    {
      date: datetimeAgo(2, 16),
      category: 'Quotidien',
      triggerDescription: 'Retour positif après avoir aidé un voisin à déménager.',
      triggerType: 'exposition',
      intensity: 3,
      thoughts: { text: 'Je suis capable de rendre service et ça fait du bien.', tags: ['Je peux y arriver'] },
      emotions: { text: 'Fierté et satisfaction', tags: ['Fierté', 'Soulagement'] },
      sensations: { text: 'Sensation de légèreté, énergie', tags: [] },
      behaviors: { text: 'J\'ai appelé Marie pour lui raconter ma journée.', tags: ['Marche'] },
    },
  ];

  const created = [];
  for (const obs of observations) {
    const entity = await strapi.documents('api::situation-observation.situation-observation').create({
      data: { ...obs, owner: user.id },
    });
    created.push(entity);
    console.log(`   ✅ ${obs.category} — intensité ${obs.intensity}/10`);
  }
  return created;
}

async function seedSituationObjectives(strapi, user, observations) {
  console.log('🎯 Objectifs de situation...');
  if (!observations || observations.length === 0) {
    console.log('   ⏭  Pas d\'observations, ignoré');
    return;
  }

  const existing = await findOrSkip(strapi, 'api::situation-objective.situation-objective', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const objectives = [
    {
      observation: observations[0]?.documentId,
      title: 'Préparer un modèle de réponse pour les demandes urgentes',
      problemType: 'practical',
      actionWhat: 'Créer un template de réponse pour les demandes de dernière minute au travail.',
      actionWhen: datetimeFromNow(3),
      targetIntensity: 4,
      status: 'completed',
      whatWorked: 'Le template m\'a permis de répondre plus vite et avec moins de stress.',
      whatDidntWork: null,
    },
    {
      observation: observations[1]?.documentId,
      title: 'Communiquer mes besoins à mes proches',
      problemType: 'practical',
      actionWhat: 'Exprimer à mon ami que les annulations sans prévenir me blessent.',
      actionWhen: datetimeFromNow(5),
      targetIntensity: 3,
      status: 'planned',
    },
    {
      observation: observations[2]?.documentId,
      title: 'Rituel matinal anti-rumination',
      problemType: 'hypothetical',
      actionWhat: 'Mettre en place une routine matinale de 15 min (méditation + gratitude).',
      actionWhen: datetimeFromNow(1),
      targetIntensity: 2,
      status: 'completed',
      whatWorked: 'La routine du matin réduit significativement les pensées anticipatoires.',
    },
  ];

  for (const obj of objectives) {
    if (!obj.observation) continue;
    await strapi.documents('api::situation-objective.situation-objective').create({
      data: { ...obj, owner: user.id },
    });
    console.log(`   ✅ ${obj.title}`);
  }
}

async function seedPersonalGoals(strapi, user) {
  console.log('🎯 Objectifs personnels...');
  const existing = await findOrSkip(strapi, 'api::personal-goal.personal-goal', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const goals = [
    {
      title: 'Reprendre une activité sportive régulière',
      description: 'Faire du sport au moins 3 fois par semaine pour améliorer mon bien-être physique et mental.',
      horizon: 'short_term',
      status: 'in_progress',
      progress: 60,
      targetDate: daysFromNow(30),
      facilitators: ['Salle de sport à côté de chez moi', 'Ami motivé pour y aller ensemble'],
      barriers: ['Fatigue certains jours', 'Météo pour les sorties extérieures'],
      frequency: '3 fois par semaine',
      actionItems: [
        { id: 'ai-1', title: 'S\'inscrire à la salle de sport', status: 'done', goalId: null, dueDate: daysAgo(15), createdAt: datetimeAgo(20) },
        { id: 'ai-2', title: 'Planifier les séances dans l\'agenda', status: 'done', goalId: null, dueDate: daysAgo(10), createdAt: datetimeAgo(15) },
        { id: 'ai-3', title: 'Première séance de natation', status: 'done', goalId: null, dueDate: daysAgo(5), createdAt: datetimeAgo(10) },
        { id: 'ai-4', title: 'Maintenir le rythme pendant 1 mois', status: 'in_progress', goalId: null, dueDate: daysFromNow(20), createdAt: datetimeAgo(5) },
      ],
    },
    {
      title: 'Suivre la formation pair-aidant',
      description: 'M\'inscrire et compléter le DU Pair-aidance pour devenir pair-aidant professionnel.',
      horizon: 'long_term',
      status: 'not_started',
      progress: 10,
      targetDate: daysFromNow(180),
      facilitators: ['Motivation personnelle', 'Soutien du GEM'],
      barriers: ['Coût de la formation', 'Disponibilité des places'],
      actionItems: [
        { id: 'ai-5', title: 'Rechercher les universités proposant le DU', status: 'done', goalId: null, dueDate: daysAgo(5), createdAt: datetimeAgo(10) },
        { id: 'ai-6', title: 'Constituer le dossier de candidature', status: 'todo', goalId: null, dueDate: daysFromNow(30), createdAt: datetimeAgo(5) },
      ],
    },
    {
      title: 'Méditer quotidiennement',
      description: 'Pratiquer la méditation de pleine conscience chaque matin pendant 10 minutes.',
      horizon: 'short_term',
      status: 'completed',
      progress: 100,
      targetDate: daysAgo(5),
      facilitators: ['Application de méditation', 'Calme matinal'],
      barriers: ['Manque de motivation certains matins'],
      frequency: 'Tous les jours',
    },
    {
      title: 'Améliorer mon alimentation',
      description: 'Cuisiner des repas équilibrés au moins 5 jours par semaine.',
      horizon: 'medium_term',
      status: 'in_progress',
      progress: 40,
      targetDate: daysFromNow(60),
      facilitators: ['Livre de recettes simples', 'Marché à proximité'],
      barriers: ['Fatigue en fin de journée', 'Budget limité'],
      frequency: '5 jours par semaine',
    },
  ];

  for (const goal of goals) {
    await strapi.documents('api::personal-goal.personal-goal').create({
      data: { ...goal, owner: user.id },
    });
    console.log(`   ✅ ${goal.title} (${goal.status}, ${goal.progress}%)`);
  }
}

async function seedSelfProblemSolving(strapi, user) {
  console.log('💡 Ateliers des Solutions...');
  const existing = await findOrSkip(strapi, 'api::self-problem-solving.self-problem-solving', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const problems = [
    {
      title: 'Gérer le stress au travail',
      category: 'work',
      currentStep: 4,
      status: 'completed',
      challengeReformulation: 'Comment réduire mon niveau de stress lorsque je reçois des demandes urgentes au travail ?',
      situation: 'Je reçois régulièrement des demandes de dernière minute qui me mettent en panique.',
      objective: 'Être capable de recevoir une demande urgente sans que mon anxiété dépasse 4/10.',
      brainstormingIdeas: [
        'Créer des modèles de réponse pré-faits',
        'Négocier des délais plus réalistes',
        'Pratiquer la respiration avant de répondre',
        'Déléguer certaines tâches',
        'Accepter que tout ne peut pas être parfait',
      ],
      solutionAnalysis: [
        { idea: 'Créer des modèles de réponse pré-faits', pros: ['Gain de temps', 'Réduit la pression'], cons: ['Demande du temps initial'] },
        { idea: 'Pratiquer la respiration avant de répondre', pros: ['Gratuit', 'Immédiat'], cons: ['Pas toujours possible en réunion'] },
      ],
      chosenSolutionIndex: 0,
      actionPlanWhat: 'Créer 3 modèles de réponse pour les demandes les plus fréquentes.',
      actionPlanWhen: daysAgo(10),
      actionSteps: [
        { taskName: 'Identifier les 3 demandes les plus fréquentes', scheduledDate: daysAgo(12), status: 'done' },
        { taskName: 'Rédiger les modèles', scheduledDate: daysAgo(10), status: 'done' },
        { taskName: 'Tester sur la prochaine demande urgente', scheduledDate: daysAgo(5), status: 'done' },
      ],
      reviewDate: daysAgo(2),
      reviewWhatWorked: 'Les modèles m\'ont fait gagner beaucoup de temps et réduit ma panique. Mon anxiété est passée de 7/10 à 3/10.',
      reviewWhatFailed: 'Certains cas nécessitent encore une adaptation du modèle.',
      reviewOutcome: 'success',
    },
    {
      title: 'Trouver un logement plus adapté',
      category: 'housing',
      currentStep: 2,
      status: 'in_progress',
      challengeReformulation: 'Comment trouver un logement calme et abordable dans mon quartier ?',
      situation: 'Mon logement actuel est bruyant et affecte mon sommeil et ma santé mentale.',
      objective: 'Trouver et emménager dans un logement plus calme d\'ici 3 mois.',
      brainstormingIdeas: [
        'Chercher dans un quartier plus calme',
        'Demander un logement social',
        'Sous-louer temporairement',
        'Insonoriser l\'appartement actuel',
      ],
      solutionAnalysis: [
        { idea: 'Demander un logement social', pros: ['Loyer réduit', 'Quartiers variés'], cons: ['Délai d\'attente long'] },
        { idea: 'Insonoriser l\'appartement actuel', pros: ['Pas de déménagement'], cons: ['Coût élevé', 'Solution partielle'] },
      ],
    },
  ];

  for (const problem of problems) {
    await strapi.documents('api::self-problem-solving.self-problem-solving').create({
      data: { ...problem, owner: user.id },
    });
    console.log(`   ✅ ${problem.title} (étape ${problem.currentStep}/4, ${problem.status})`);
  }
}

async function seedPersonalNotebook(strapi, user) {
  console.log('📓 Journal de bord...');
  const existing = await findOrSkip(strapi, 'api::personal-notebook.personal-notebook', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const entries = [
    { date: daysAgo(14), title: 'Journée difficile', content: 'Aujourd\'hui a été compliqué. Je me suis senti(e) submergé(e) par le travail et j\'ai eu du mal à me concentrer. J\'ai quand même réussi à sortir marcher 15 minutes, ce qui m\'a fait un peu de bien.', mood: 'bad', tags: ['travail', 'stress'] },
    { date: daysAgo(11), title: 'Journée de repos réparatrice', content: 'Jour de repos bien mérité. J\'ai pris le temps de lire, de faire une sieste et de voir un ami pour un café. Je me sens beaucoup mieux qu\'en début de semaine.', mood: 'good', tags: ['repos', 'social'] },
    { date: daysAgo(9), title: 'Première séance de yoga', content: 'J\'ai essayé le yoga pour la première fois. C\'était bien, même si j\'ai trouvé ça difficile physiquement. Le professeur était bienveillant et m\'a encouragé(e). Je veux y retourner.', mood: 'good', tags: ['sport', 'nouveau'] },
    { date: daysAgo(7), title: 'Rechute légère', content: 'Soirée avec des amis hier soir. J\'ai trop bu et ce matin je me sens mal physiquement et mentalement. Je sais que l\'alcool n\'aide pas mais c\'est dur de refuser dans un contexte social.', mood: 'bad', tags: ['alcool', 'social'] },
    { date: daysAgo(5), title: 'Reprise en main', content: 'J\'ai décidé de reprendre les choses en main. Longue marche au parc, méditation de 20 minutes, et cuisine d\'un repas sain. Petit à petit, je retrouve mon équilibre.', mood: 'good', tags: ['motivation', 'nature'] },
    { date: daysAgo(3), title: 'Fierté', content: 'Aujourd\'hui j\'ai réussi à gérer une situation stressante au travail sans paniquer. J\'ai utilisé la respiration carrée et les modèles que j\'ai préparés. Je suis fier/fière de moi.', mood: 'very_good', tags: ['travail', 'progrès'] },
    { date: daysAgo(1), title: 'Randonnée et gratitude', content: 'Superbe randonnée en forêt ce matin. Le contact avec la nature me fait un bien fou. En rentrant, j\'ai listé 3 choses pour lesquelles je suis reconnaissant(e). La vie n\'est pas parfaite mais il y a de belles choses.', mood: 'very_good', tags: ['nature', 'gratitude'] },
  ];

  for (const entry of entries) {
    await strapi.documents('api::personal-notebook.personal-notebook').create({
      data: { ...entry, owner: user.id },
    });
    const moodEmoji = { very_bad: '😞', bad: '😔', neutral: '😐', good: '😊', very_good: '😄' };
    console.log(`   ✅ ${entry.date} ${moodEmoji[entry.mood] || ''} ${entry.title}`);
  }
}

async function seedPersonalCalendarEvents(strapi, user) {
  console.log('📅 Événements du calendrier...');
  const existing = await findOrSkip(strapi, 'api::personal-calendar-event.personal-calendar-event', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const events = [
    { title: 'RDV psychiatre — Dr Martin', description: 'Consultation de suivi mensuelle.', startDate: datetimeFromNow(3, 14), endDate: datetimeFromNow(3, 15), eventType: 'appointment' },
    { title: 'Traitement matin', description: 'Prise du traitement quotidien.', startDate: datetimeFromNow(0, 8), eventType: 'medication', recurrence: { frequency: 'daily' } },
    { title: 'Yoga', description: 'Séance de yoga au centre communautaire.', startDate: datetimeFromNow(2, 18), endDate: datetimeFromNow(2, 19), eventType: 'activity' },
    { title: 'Groupe de parole GEM', description: 'Groupe d\'entraide hebdomadaire au GEM.', startDate: datetimeFromNow(5, 15), endDate: datetimeFromNow(5, 17), eventType: 'activity' },
    { title: 'Objectif : natation 1h', description: 'Séance de natation — objectif sport 3x/semaine.', startDate: datetimeFromNow(1, 10), endDate: datetimeFromNow(1, 11), eventType: 'goal_milestone' },
    { title: 'Méditation pleine conscience', description: 'Séance guidée en ligne.', startDate: datetimeFromNow(4, 7), endDate: datetimeFromNow(4, 7), eventType: 'activity' },
  ];

  for (const event of events) {
    await strapi.documents('api::personal-calendar-event.personal-calendar-event').create({
      data: { ...event, isAllDay: false, owner: user.id },
    });
    console.log(`   ✅ ${event.title} (${event.eventType})`);
  }
}

async function seedSelfAssessments(strapi, user) {
  console.log('📊 Auto-évaluations...');
  const existing = await findOrSkip(strapi, 'api::self-assessment.self-assessment', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  // Trouver les templates
  const rasTemplate = await strapi.documents('api::assessment-template.assessment-template').findFirst({
    filters: { slug: 'ras-r' },
  });
  const patriciaTemplate = await strapi.documents('api::assessment-template.assessment-template').findFirst({
    filters: { slug: 'patricia-flower' },
  });

  if (!rasTemplate && !patriciaTemplate) {
    console.log('   ⏭  Aucun template trouvé, lancez seed.js d\'abord');
    return;
  }

  // Évaluations RAS-r (3 sur plusieurs semaines montrant une progression)
  if (rasTemplate) {
    const rasAssessments = [
      {
        date: daysAgo(28),
        scores: { 'personal-confidence': 2.2, 'willingness-to-ask': 2.8, 'goal-orientation': 2.0, 'reliance-on-others': 3.0, 'no-domination': 1.8 },
        responses: { 'ras-1': 2, 'ras-2': 2, 'ras-3': 3, 'ras-4': 3, 'ras-5': 2 },
        globalScore: 2.36,
      },
      {
        date: daysAgo(14),
        scores: { 'personal-confidence': 3.0, 'willingness-to-ask': 3.2, 'goal-orientation': 2.8, 'reliance-on-others': 3.4, 'no-domination': 2.4 },
        responses: { 'ras-1': 3, 'ras-2': 3, 'ras-3': 3, 'ras-4': 3, 'ras-5': 2 },
        globalScore: 2.96,
      },
      {
        date: daysAgo(1),
        scores: { 'personal-confidence': 3.6, 'willingness-to-ask': 3.8, 'goal-orientation': 3.4, 'reliance-on-others': 3.8, 'no-domination': 3.0 },
        responses: { 'ras-1': 4, 'ras-2': 3, 'ras-3': 4, 'ras-4': 4, 'ras-5': 3 },
        globalScore: 3.52,
      },
    ];

    for (const assessment of rasAssessments) {
      await strapi.documents('api::self-assessment.self-assessment').create({
        data: {
          ...assessment,
          template: rasTemplate.documentId,
          owner: user.id,
        },
      });
      console.log(`   ✅ RAS-r ${assessment.date} — score ${assessment.globalScore}`);
    }
  }

  // Évaluations Patricia Flower (2 évaluations)
  if (patriciaTemplate) {
    const patriciaAssessments = [
      {
        date: daysAgo(21),
        scores: {
          'histoire': 2, 'definitions': 3, 'espoir': 2, 'amour-amitie': 3,
          'entraide-pairs': 2, 'retablir-guerir': 3, 'retablissement-clinique': 3,
          'pouvoir-agir': 2, 'strategies': 2, 'professionnels': 3, 'questions-critiques': 2,
        },
        responses: {
          'pat-1': 2, 'pat-2': 3, 'pat-3': 2, 'pat-4': 3, 'pat-5': 2,
          'pat-6': 3, 'pat-7': 3, 'pat-8': 2, 'pat-9': 2, 'pat-10': 3, 'pat-11': 2,
        },
        globalScore: 2.45,
      },
      {
        date: daysAgo(3),
        scores: {
          'histoire': 3, 'definitions': 4, 'espoir': 3, 'amour-amitie': 4,
          'entraide-pairs': 3, 'retablir-guerir': 4, 'retablissement-clinique': 4,
          'pouvoir-agir': 3, 'strategies': 3, 'professionnels': 4, 'questions-critiques': 3,
        },
        responses: {
          'pat-1': 3, 'pat-2': 4, 'pat-3': 3, 'pat-4': 4, 'pat-5': 3,
          'pat-6': 4, 'pat-7': 4, 'pat-8': 3, 'pat-9': 3, 'pat-10': 4, 'pat-11': 3,
        },
        globalScore: 3.45,
      },
    ];

    for (const assessment of patriciaAssessments) {
      await strapi.documents('api::self-assessment.self-assessment').create({
        data: {
          ...assessment,
          template: patriciaTemplate.documentId,
          owner: user.id,
        },
      });
      console.log(`   ✅ Patricia ${assessment.date} — score ${assessment.globalScore}`);
    }
  }
}

async function seedRecoveryRecommendations(strapi, user) {
  console.log('💡 Recommandations...');
  const existing = await findOrSkip(strapi, 'api::recovery-recommendation.recovery-recommendation', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  // Trouver quelques articles et événements existants pour les recommandations
  const articles = await strapi.documents('api::blog-article.blog-article').findMany({ limit: 3 });
  const events = await strapi.documents('api::event.event').findMany({ limit: 2 });
  const tutorials = await strapi.documents('api::tutorial.tutorial').findMany({ limit: 2 });

  const recommendations = [];

  if (articles[0]) {
    recommendations.push({
      type: 'article',
      targetContentType: 'api::blog-article.blog-article',
      targetContentId: articles[0].id,
      reason: 'Basé sur votre intérêt pour le rétablissement, cet article pourrait vous inspirer.',
      relevanceScore: 0.85,
      isViewed: true,
      isDismissed: false,
    });
  }

  if (articles[1]) {
    recommendations.push({
      type: 'article',
      targetContentType: 'api::blog-article.blog-article',
      targetContentId: articles[1].id,
      reason: 'Article recommandé en lien avec votre stade de préparation.',
      relevanceScore: 0.72,
      isViewed: false,
      isDismissed: false,
    });
  }

  if (events[0]) {
    recommendations.push({
      type: 'event',
      targetContentType: 'api::event.event',
      targetContentId: events[0].id,
      reason: 'Cet événement correspond à vos centres d\'intérêt.',
      relevanceScore: 0.90,
      isViewed: false,
      isDismissed: false,
    });
  }

  if (tutorials[0]) {
    recommendations.push({
      type: 'tutorial',
      targetContentType: 'api::tutorial.tutorial',
      targetContentId: tutorials[0].id,
      reason: 'Ce tutoriel peut vous aider à mieux utiliser les outils de la plateforme.',
      relevanceScore: 0.78,
      isViewed: false,
      isDismissed: false,
    });
  }

  recommendations.push({
    type: 'goal_suggestion',
    targetContentType: '',
    targetContentId: 0,
    reason: 'Votre progression montre que vous êtes prêt(e) à définir un objectif à moyen terme pour votre parcours professionnel.',
    relevanceScore: 0.65,
    isViewed: false,
    isDismissed: false,
  });

  recommendations.push({
    type: 'assessment',
    targetContentType: 'api::assessment-template.assessment-template',
    targetContentId: 0,
    reason: 'Cela fait 2 semaines depuis votre dernière auto-évaluation. Un nouveau check-up permettrait de mesurer votre évolution.',
    relevanceScore: 0.80,
    isViewed: false,
    isDismissed: false,
  });

  for (const rec of recommendations) {
    await strapi.documents('api::recovery-recommendation.recovery-recommendation').create({
      data: { ...rec, owner: user.id },
    });
    console.log(`   ✅ ${rec.type} — pertinence ${rec.relevanceScore}`);
  }
}

async function seedGeneratedDocuments(strapi, user) {
  console.log('📄 Documents générés...');
  const existing = await findOrSkip(strapi, 'api::generated-document.generated-document', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  // Trouver les templates de documents
  const crisisTemplate = await strapi.documents('api::document-template.document-template').findFirst({
    filters: { slug: 'plan-de-crise' },
  });

  const docs = [
    {
      title: 'Mon plan de crise — Mars 2026',
      generatedData: {
        templateSlug: 'plan-de-crise',
        earlyWarningSigns: ['Insomnie > 3 nuits', 'Isolement', 'Pensées négatives en boucle'],
        copingStrategies: ['Marcher', 'Appeler Marie', 'Respiration carrée'],
        emergencyContacts: [
          { name: 'Dr Martin', phone: '01 42 00 00 00' },
          { name: 'SOS Amitié', phone: '09 72 39 40 50' },
        ],
        safeActions: ['Aller au GEM', 'Appeler le 3114'],
        generatedAt: datetimeAgo(5),
      },
      generatedAt: datetimeAgo(5),
    },
  ];

  if (crisisTemplate) {
    docs[0].template = crisisTemplate.documentId;
  }

  for (const doc of docs) {
    await strapi.documents('api::generated-document.generated-document').create({
      data: { ...doc, owner: user.id },
    });
    console.log(`   ✅ ${doc.title}`);
  }
}

async function seedRecoveryTracking(strapi, user) {
  console.log('📈 Suivi du rétablissement...');
  const existing = await findOrSkip(strapi, 'api::recovery-tracking.recovery-tracking', { owner: user.id });
  if (existing) {
    console.log('   ⏭  Existent déjà');
    return;
  }

  const trackings = [
    {
      date: daysAgo(14),
      overallScore: 35,
      recoveryStage: 'preparation',
      stabilityTrend: 'stable',
      moduleScores: {
        se_connaitre: { score: 30, details: { assessmentCount: 1, observationCount: 1 } },
        agir: { score: 20, details: { goalCount: 2, completedGoals: 0 } },
        gerer: { score: 40, details: { notebookEntryCount: 3, checkinCount: 7 } },
        profil: { score: 50, details: { profileCompleteness: 71 } },
      },
      toolUsage: [
        { key: 'selfAssessments', label: 'Auto-évaluations', section: 'se_connaitre', count: 1, isUsed: true },
        { key: 'observations', label: 'Décodeur de situations', section: 'se_connaitre', count: 1, isUsed: true },
        { key: 'goals', label: 'Objectifs personnels', section: 'agir', count: 2, isUsed: true },
        { key: 'notebooks', label: 'Journal de bord', section: 'gerer', count: 3, isUsed: true },
        { key: 'wellnessCheckins', label: 'Check-ins bien-être', section: 'gerer', count: 7, isUsed: true },
      ],
      evolution: { trend: 'stable', previousScore: null, scoreDelta: 0, moduleDeltas: {} },
      suggestions: {
        suggestions: [{ type: 'discover_tool', priority: 'medium', message: 'Essayez l\'Atelier des Solutions.' }],
        orientation: { currentStage: 'preparation', readyForNextStage: false, overallAssessment: 'Votre parcours commence à prendre forme.' },
      },
    },
    {
      date: daysAgo(1),
      overallScore: 55,
      recoveryStage: 'preparation',
      stabilityTrend: 'improving',
      moduleScores: {
        se_connaitre: { score: 55, details: { assessmentCount: 5, observationCount: 4 } },
        agir: { score: 50, details: { goalCount: 4, completedGoals: 1, completionRate: 25 } },
        gerer: { score: 60, details: { notebookEntryCount: 7, checkinCount: 14 } },
        profil: { score: 55, details: { profileCompleteness: 86 } },
      },
      toolUsage: [
        { key: 'selfAssessments', label: 'Auto-évaluations', section: 'se_connaitre', count: 5, isUsed: true },
        { key: 'observations', label: 'Décodeur de situations', section: 'se_connaitre', count: 4, isUsed: true },
        { key: 'earlyWarningSigns', label: 'Signaux avant-coureurs', section: 'se_connaitre', count: 1, isUsed: true },
        { key: 'goals', label: 'Objectifs personnels', section: 'agir', count: 4, isUsed: true },
        { key: 'problemSolvings', label: 'Atelier des Solutions', section: 'agir', count: 2, isUsed: true },
        { key: 'notebooks', label: 'Journal de bord', section: 'gerer', count: 7, isUsed: true },
        { key: 'wellnessCheckins', label: 'Check-ins bien-être', section: 'gerer', count: 14, isUsed: true },
        { key: 'calendarEvents', label: 'Agenda personnel', section: 'gerer', count: 6, isUsed: true },
      ],
      evolution: { trend: 'improving', previousScore: 35, previousDate: daysAgo(14), scoreDelta: 20, moduleDeltas: { se_connaitre: 25, agir: 30, gerer: 20, profil: 5 } },
      suggestions: {
        suggestions: [
          { type: 'encouragement', priority: 'low', message: 'Votre score a progressé de +20 points. Continuez sur cette lancée !' },
          { type: 'stage_recommendation', priority: 'high', message: 'Définissez des objectifs à court terme réalistes pour avancer dans votre préparation.' },
        ],
        orientation: { currentStage: 'preparation', readyForNextStage: false, nextStage: 'rebuilding', overallAssessment: 'Vous êtes sur la bonne voie. Concentrez-vous sur les domaines identifiés.' },
      },
    },
  ];

  for (const tracking of trackings) {
    await strapi.documents('api::recovery-tracking.recovery-tracking').create({
      data: { ...tracking, owner: user.id },
    });
    console.log(`   ✅ ${tracking.date} — score ${tracking.overallScore}/100 (${tracking.stabilityTrend})`);
  }
}

// =====================================================================
// Run
// =====================================================================

seedAll().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
