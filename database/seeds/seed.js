'use strict';

/**
 * Script de seed — Pairemancipation
 *
 * Crée des données de démonstration :
 * - 5 catégories de blog + 10 tags
 * - 5 catégories de ressources
 * - 8 types de services
 * - 5 structures (Paris, Lyon, Lille, Nantes, Marseille)
 * - 10 articles de blog
 * - 10 événements
 * - 5 actualités
 * - 3 modèles d'autoévaluation (WHO-5, RAS-r, SWLS)
 *
 * Usage :
 *   SEED_ADMIN_EMAIL=admin@example.fr SEED_ADMIN_PASSWORD=Secret123! \
 *   SEED_DEMO_EMAIL=demo@example.fr SEED_DEMO_PASSWORD=Demo123! \
 *   npm run seed --workspace=apps/backend
 */

require('dotenv').config();
const { createStrapi } = require('@strapi/strapi');
const bcrypt = require('bcryptjs');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ Variable d'environnement requise manquante : ${name}`);
    console.error('   Exemple : SEED_ADMIN_EMAIL=admin@example.fr SEED_ADMIN_PASSWORD=MotDePasse123! npm run seed --workspace=apps/backend');
    process.exit(1);
  }
  return value;
}

const ADMIN_EMAIL = requireEnv('SEED_ADMIN_EMAIL');
const ADMIN_PASSWORD = requireEnv('SEED_ADMIN_PASSWORD');

const DEMO_USER_EMAIL = requireEnv('SEED_DEMO_EMAIL');
const DEMO_USER_PASSWORD = requireEnv('SEED_DEMO_PASSWORD');
const DEMO_USER_USERNAME = process.env.SEED_DEMO_USERNAME || 'DemoPair';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Strapi "blocks" rich-text helper — wraps text in a paragraph. */
function blocksText(text) {
  return [
    {
      type: 'paragraph',
      children: [{ type: 'text', text }],
    },
  ];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const blogCategories = [
  { name: 'Témoignages', description: 'Récits de parcours de rétablissement', icon: 'heart' },
  { name: 'Santé mentale', description: 'Informations et conseils sur la santé mentale', icon: 'brain' },
  { name: 'Pair-aidance', description: "Articles sur le pair-accompagnement et l'entraide", icon: 'users' },
  { name: 'Droits & citoyenneté', description: 'Droits des usagers en santé mentale', icon: 'scale' },
  { name: 'Bien-être', description: 'Pratiques de bien-être et auto-soin', icon: 'sun' },
];

const tags = [
  'Rétablissement',
  'Pair-aidance',
  'Santé mentale',
  'Bien-être',
  'Témoignage',
  'Droits',
  'Inclusion',
  'Autonomie',
  'Résilience',
  'Communauté',
];

const knowledgeCategories = [
  { name: 'Comprendre la santé mentale', description: 'Bases et concepts clés' },
  { name: 'Parcours de rétablissement', description: 'Étapes et outils du rétablissement' },
  { name: 'Pair-aidance', description: 'Méthodes et pratiques du pair-accompagnement' },
  { name: 'Droits des usagers', description: 'Cadre légal et droits fondamentaux' },
  { name: 'Ressources pratiques', description: 'Guides et fiches pratiques du quotidien' },
];

const serviceTypes = [
  { name: 'CMP', icon: 'hospital' },
  { name: 'GEM', icon: 'users' },
  { name: 'CATTP', icon: 'activity' },
  { name: 'Hôpital de jour', icon: 'building' },
  { name: 'SAVS', icon: 'home' },
  { name: 'Pair-aidance', icon: 'heart-handshake' },
  { name: 'Psychologue', icon: 'brain' },
  { name: 'Association', icon: 'flag' },
];

const structures = [
  {
    name: 'GEM Paris Entraide',
    type: 'association',
    description: "Groupe d'entraide mutuelle situé dans le 11e arrondissement de Paris, ouvert à toute personne concernée par un trouble psychique.",
    address: { street: '15 Rue Oberkampf', postalCode: '75011', city: 'Paris', department: 'Paris', region: 'Île-de-France', country: 'France' },
    coordinates: { latitude: 48.8649, longitude: 2.3688 },
    phone: '01 43 55 00 00',
    email: 'contact@gem-paris.fr',
    website: 'https://gem-paris-entraide.fr',
    serviceIndices: [1, 5], // GEM, Pair-aidance
  },
  {
    name: 'CMP Lyon 3e',
    type: 'public',
    description: 'Centre médico-psychologique du 3e arrondissement de Lyon. Consultations psychiatriques, suivi ambulatoire et orientation.',
    address: { street: '42 Avenue Lacassagne', postalCode: '69003', city: 'Lyon', department: 'Rhône', region: 'Auvergne-Rhône-Alpes', country: 'France' },
    coordinates: { latitude: 45.7578, longitude: 4.8713 },
    phone: '04 72 11 00 00',
    email: 'cmp-lyon3@ch-vinatier.fr',
    serviceIndices: [0, 2], // CMP, CATTP
  },
  {
    name: 'Association Santé Mentale Lille',
    type: 'association',
    description: "Association lilloise proposant des activités de pair-accompagnement, des groupes de parole et un soutien à l'insertion sociale.",
    address: { street: '8 Rue de Gand', postalCode: '59000', city: 'Lille', department: 'Nord', region: 'Hauts-de-France', country: 'France' },
    coordinates: { latitude: 50.6365, longitude: 3.0635 },
    phone: '03 20 00 00 00',
    email: 'contact@asm-lille.fr',
    serviceIndices: [5, 7], // Pair-aidance, Association
  },
  {
    name: 'GEM Nantes Solidarité',
    type: 'community',
    description: "Groupe d'entraide mutuelle nantais, lieu d'accueil convivial pour les personnes vivant avec un trouble psychique.",
    address: { street: '22 Rue Fouré', postalCode: '44000', city: 'Nantes', department: 'Loire-Atlantique', region: 'Pays de la Loire', country: 'France' },
    coordinates: { latitude: 47.2184, longitude: -1.5536 },
    phone: '02 40 00 00 00',
    email: 'gem-nantes@solidarite.fr',
    serviceIndices: [1, 5], // GEM, Pair-aidance
  },
  {
    name: 'Hôpital de jour Marseille Sud',
    type: 'public',
    description: "Hôpital de jour spécialisé en psychiatrie adulte, proposant des prises en charge thérapeutiques à temps partiel.",
    address: { street: '120 Boulevard Baille', postalCode: '13005', city: 'Marseille', department: 'Bouches-du-Rhône', region: "Provence-Alpes-Côte d'Azur", country: 'France' },
    coordinates: { latitude: 43.2865, longitude: 5.3958 },
    phone: '04 91 38 00 00',
    serviceIndices: [3, 0], // Hôpital de jour, CMP
  },
];

const blogArticles = [
  { title: 'Mon parcours de rétablissement', excerpt: "Témoignage d'une personne ayant traversé la dépression et trouvé le chemin du rétablissement grâce au pair-accompagnement.", categoryIdx: 0, tagIndices: [0, 4, 8] },
  { title: "Qu'est-ce que le pair-accompagnement ?", excerpt: "Découvrez les principes fondamentaux du pair-accompagnement en santé mentale et comment il peut soutenir votre parcours.", categoryIdx: 2, tagIndices: [1, 0, 9] },
  { title: '5 pratiques de bien-être au quotidien', excerpt: "Des conseils simples et accessibles pour prendre soin de sa santé mentale au jour le jour.", categoryIdx: 4, tagIndices: [3, 7] },
  { title: 'Comprendre les droits des usagers en psychiatrie', excerpt: "Guide pratique sur les droits fondamentaux des personnes suivies en santé mentale.", categoryIdx: 3, tagIndices: [5, 6] },
  { title: "L'importance du lien social dans le rétablissement", excerpt: "Comment le soutien communautaire et les relations sociales contribuent au processus de rétablissement.", categoryIdx: 1, tagIndices: [0, 9, 6] },
  { title: "Témoignage : retrouver confiance grâce au GEM", excerpt: "Marie raconte comment le Groupe d'Entraide Mutuelle l'a aidée à reprendre confiance en elle.", categoryIdx: 0, tagIndices: [4, 9, 0] },
  { title: "L'autogestion en santé mentale", excerpt: "Stratégies et outils pour devenir acteur de son propre rétablissement et gagner en autonomie.", categoryIdx: 1, tagIndices: [7, 0, 3] },
  { title: 'Pair-aidant : un métier en plein essor', excerpt: "Le métier de pair-aidant se développe en France. Retour sur cette profession au cœur du rétablissement.", categoryIdx: 2, tagIndices: [1, 6, 9] },
  { title: 'Méditation et santé mentale', excerpt: "Les bienfaits de la méditation de pleine conscience pour les personnes vivant avec un trouble psychique.", categoryIdx: 4, tagIndices: [3, 8] },
  { title: 'Résilience : rebondir après la crise', excerpt: "Comment développer sa capacité de résilience et transformer les épreuves en force.", categoryIdx: 1, tagIndices: [8, 0, 7] },
];

const events = [
  { title: 'Atelier pair-aidance Paris', eventType: 'workshop', startDaysFromNow: 7, durationHours: 3, city: 'Paris', organizer: 'GEM Paris Entraide', structureIdx: 0 },
  { title: 'Conférence santé mentale et emploi', eventType: 'conference', startDaysFromNow: 14, durationHours: 4, city: 'Lyon', organizer: 'CMP Lyon 3e', structureIdx: 1 },
  { title: 'Groupe de parole — Lille', eventType: 'support_group', startDaysFromNow: 3, durationHours: 2, city: 'Lille', organizer: 'ASM Lille', structureIdx: 2 },
  { title: 'Formation pair-aidant professionnel', eventType: 'training', startDaysFromNow: 30, durationHours: 8, city: 'Nantes', organizer: 'GEM Nantes Solidarité', structureIdx: 3 },
  { title: 'Rencontre inter-GEM Île-de-France', eventType: 'meetup', startDaysFromNow: 21, durationHours: 5, city: 'Paris', organizer: 'Fédération GEM IDF', structureIdx: 0 },
  { title: 'Atelier méditation pleine conscience', eventType: 'workshop', startDaysFromNow: 5, durationHours: 1.5, city: 'Marseille', organizer: 'Hôpital de jour Marseille Sud', structureIdx: 4 },
  { title: 'Journée portes ouvertes — GEM Nantes', eventType: 'other', startDaysFromNow: 10, durationHours: 6, city: 'Nantes', organizer: 'GEM Nantes Solidarité', structureIdx: 3 },
  { title: 'Webinaire : droits des usagers en psychiatrie', eventType: 'conference', startDaysFromNow: 12, durationHours: 2, city: 'En ligne', organizer: 'Pairemancipation', isOnline: true },
  { title: 'Atelier écriture thérapeutique', eventType: 'workshop', startDaysFromNow: 8, durationHours: 2.5, city: 'Lyon', organizer: 'CMP Lyon 3e', structureIdx: 1 },
  { title: 'Marche solidaire santé mentale', eventType: 'other', startDaysFromNow: 45, durationHours: 4, city: 'Paris', organizer: 'Collectif Santé Mentale', structureIdx: 0 },
];

const newsItems = [
  { title: "Semaine d'information sur la santé mentale 2026", excerpt: "La SISM 2026 se tiendra du 10 au 23 mars, sur le thème « Santé mentale et lien social ».", source: 'Ministère de la Santé' },
  { title: "Nouveau plan national de santé mentale", excerpt: "Le gouvernement annonce un plan de 500 millions d'euros pour renforcer la prise en charge en santé mentale.", source: 'Gouvernement.fr' },
  { title: "Ouverture du premier GEM numérique en France", excerpt: "Un Groupe d'Entraide Mutuelle entièrement en ligne ouvre ses portes pour les personnes isolées géographiquement.", source: 'France Info' },
  { title: "Formation pair-aidant : le diplôme universitaire se généralise", excerpt: "De plus en plus d'universités proposent un DU Pair-aidance en santé mentale. État des lieux.", source: 'Le Monde' },
  { title: "Étude : les bienfaits du pair-accompagnement confirmés", excerpt: "Une étude de l'INSERM confirme l'efficacité du pair-accompagnement dans le processus de rétablissement.", source: 'INSERM' },
];

// WHO-5, RAS-r, SWLS assessment templates
const assessmentTemplates = [
  {
    name: 'WHO-5 (Well-Being Index)',
    slug: 'who-5',
    description: "L'indice de bien-être OMS en 5 questions. Outil de dépistage validé internationalement pour évaluer le bien-être subjectif sur les deux dernières semaines.",
    version: '1998-WHO',
    scoringMethod: 'sum',
    dimensions: [
      { dimensionId: 'wellbeing', name: 'Bien-être général', description: 'Score global de bien-être', weight: 1 },
    ],
    questions: [
      { questionId: 'who5-1', text: 'Je me suis senti(e) gai(e) et de bonne humeur.', type: 'likert_5', dimension: 'wellbeing', order: 1 },
      { questionId: 'who5-2', text: 'Je me suis senti(e) calme et tranquille.', type: 'likert_5', dimension: 'wellbeing', order: 2 },
      { questionId: 'who5-3', text: "Je me suis senti(e) actif(ve) et vigoureux(se).", type: 'likert_5', dimension: 'wellbeing', order: 3 },
      { questionId: 'who5-4', text: 'Je me suis réveillé(e) frais(che) et dispos(e).', type: 'likert_5', dimension: 'wellbeing', order: 4 },
      { questionId: 'who5-5', text: "Ma vie quotidienne a été remplie de choses qui m'intéressent.", type: 'likert_5', dimension: 'wellbeing', order: 5 },
    ],
  },
  {
    name: 'RAS-r (Recovery Assessment Scale)',
    slug: 'ras-r',
    description: "Échelle d'évaluation du rétablissement révisée. Mesure les différentes dimensions du processus de rétablissement en santé mentale.",
    version: 'RAS-r-24',
    scoringMethod: 'average',
    dimensions: [
      { dimensionId: 'personal-confidence', name: 'Confiance personnelle', description: 'Confiance en soi et espoir', weight: 1 },
      { dimensionId: 'willingness-to-ask', name: "Volonté de demander de l'aide", description: "Capacité à solliciter de l'aide", weight: 1 },
      { dimensionId: 'goal-orientation', name: 'Orientation vers les objectifs', description: 'Motivation et sens de la vie', weight: 1 },
      { dimensionId: 'reliance-on-others', name: 'Appui sur les autres', description: 'Soutien social et relations', weight: 1 },
      { dimensionId: 'no-domination', name: 'Non-domination des symptômes', description: 'Gestion des symptômes', weight: 1 },
    ],
    questions: [
      { questionId: 'ras-1', text: "J'ai le désir de réussir.", type: 'likert_5', dimension: 'personal-confidence', order: 1 },
      { questionId: 'ras-2', text: "J'ai mes propres projets pour mon avenir.", type: 'likert_5', dimension: 'goal-orientation', order: 2 },
      { questionId: 'ras-3', text: "J'ai des gens sur qui je peux compter.", type: 'likert_5', dimension: 'reliance-on-others', order: 3 },
      { questionId: 'ras-4', text: "Je suis capable de demander de l'aide quand j'en ai besoin.", type: 'likert_5', dimension: 'willingness-to-ask', order: 4 },
      { questionId: 'ras-5', text: "Mes symptômes interfèrent de moins en moins avec ma vie.", type: 'likert_5', dimension: 'no-domination', order: 5 },
    ],
  },
  {
    name: 'SWLS (Satisfaction With Life Scale)',
    slug: 'swls',
    description: "Échelle de satisfaction de vie de Diener. Mesure le jugement global qu'une personne porte sur sa satisfaction de vie.",
    version: 'Diener-1985',
    scoringMethod: 'sum',
    dimensions: [
      { dimensionId: 'life-satisfaction', name: 'Satisfaction de vie', description: 'Score global de satisfaction', weight: 1 },
    ],
    questions: [
      { questionId: 'swls-1', text: 'En général, ma vie correspond de près à mes idéaux.', type: 'likert_7', dimension: 'life-satisfaction', order: 1 },
      { questionId: 'swls-2', text: 'Mes conditions de vie sont excellentes.', type: 'likert_7', dimension: 'life-satisfaction', order: 2 },
      { questionId: 'swls-3', text: 'Je suis satisfait(e) de ma vie.', type: 'likert_7', dimension: 'life-satisfaction', order: 3 },
      { questionId: 'swls-4', text: "Jusqu'à maintenant, j'ai obtenu les choses importantes que je voulais de la vie.", type: 'likert_7', dimension: 'life-satisfaction', order: 4 },
      { questionId: 'swls-5', text: "Si je pouvais recommencer ma vie, je n'y changerais presque rien.", type: 'likert_7', dimension: 'life-satisfaction', order: 5 },
    ],
  },
  {
    name: 'La Fleur de Patricia',
    slug: 'patricia-flower',
    description: "Auto-évaluation basée sur les 11 pétales de la Fleur de Patricia (Carnet du rétablissement, En Route 2018). Chaque pétale représente une dimension du rétablissement.",
    version: '1.0',
    scoringMethod: 'average',
    dimensions: [
      { dimensionId: 'histoire', name: 'Histoire', description: "Connaissance de l'histoire du mouvement du rétablissement", weight: 1 },
      { dimensionId: 'definitions', name: 'Définitions', description: 'Compréhension personnelle du processus de rétablissement', weight: 1 },
      { dimensionId: 'espoir', name: 'Espoir', description: "Espoir en un avenir meilleur et confiance en ses possibilités", weight: 1 },
      { dimensionId: 'amour-amitie', name: 'Amour et amitié', description: 'Qualité des relations et du soutien affectif', weight: 1 },
      { dimensionId: 'entraide-pairs', name: 'Entraide entre pairs', description: "Participation à l'entraide et au partage entre pairs", weight: 1 },
      { dimensionId: 'retablir-guerir', name: 'Se rétablir ≠ guérir', description: 'Acceptation de la différence entre rétablissement et guérison', weight: 1 },
      { dimensionId: 'retablissement-clinique', name: 'Rétablissement clinique', description: 'Contribution positive du suivi clinique', weight: 1 },
      { dimensionId: 'pouvoir-agir', name: "Pouvoir d'agir", description: 'Reprise de pouvoir sur sa vie et ses décisions', weight: 1 },
      { dimensionId: 'strategies', name: 'Stratégies', description: 'Développement de stratégies personnelles', weight: 1 },
      { dimensionId: 'professionnels', name: 'Les professionnels', description: 'Qualité de la relation avec les professionnels', weight: 1 },
      { dimensionId: 'questions-critiques', name: 'Questions et critiques', description: 'Regard critique et éclairé sur le parcours', weight: 1 },
    ],
    questions: [
      { questionId: 'pat-1', text: "Je m'inspire de récits de rétablissement et je me reconnais dans l'histoire de ce mouvement.", type: 'likert_5', dimension: 'histoire', order: 1 },
      { questionId: 'pat-2', text: "J'ai ma propre définition de mon rétablissement et je comprends ce processus personnel.", type: 'likert_5', dimension: 'definitions', order: 2 },
      { questionId: 'pat-3', text: "J'ai de l'espoir en un avenir meilleur et je crois en mes possibilités de rétablissement.", type: 'likert_5', dimension: 'espoir', order: 3 },
      { questionId: 'pat-4', text: "Je me sens entouré(e) et soutenu(e) par des relations bienveillantes.", type: 'likert_5', dimension: 'amour-amitie', order: 4 },
      { questionId: 'pat-5', text: "Je bénéficie de l'entraide entre pairs et je partage mon expérience avec d'autres.", type: 'likert_5', dimension: 'entraide-pairs', order: 5 },
      { questionId: 'pat-6', text: "J'accepte que le rétablissement est un processus différent de la guérison.", type: 'likert_5', dimension: 'retablir-guerir', order: 6 },
      { questionId: 'pat-7', text: "Mon suivi clinique contribue positivement à mon parcours et me donne espoir.", type: 'likert_5', dimension: 'retablissement-clinique', order: 7 },
      { questionId: 'pat-8', text: "Je reprends du pouvoir sur ma vie et je suis capable de prendre des décisions pour moi-même.", type: 'likert_5', dimension: 'pouvoir-agir', order: 8 },
      { questionId: 'pat-9', text: "J'ai développé des stratégies personnelles efficaces pour faire face aux difficultés.", type: 'likert_5', dimension: 'strategies', order: 9 },
      { questionId: 'pat-10', text: "Ma relation avec les professionnels est basée sur le partenariat, le respect et la confiance.", type: 'likert_5', dimension: 'professionnels', order: 10 },
      { questionId: 'pat-11', text: "J'ai un regard critique et éclairé sur mon parcours et sur le système de soins.", type: 'likert_5', dimension: 'questions-critiques', order: 11 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seed() {
  console.log('🌱 Démarrage du seed Pairemancipation...\n');

  const appContext = await createStrapi({ distDir: './dist' }).load();
  const strapi = appContext;

  // Authenticate or create admin
  let admin = await strapi.db
    .query('admin::user')
    .findOne({ where: { email: ADMIN_EMAIL } });

  if (!admin) {
    console.log(`⚙️  Aucun admin trouvé, création de ${ADMIN_EMAIL}...`);
    const superAdminRole = await strapi.db
      .query('admin::role')
      .findOne({ where: { code: 'strapi-super-admin' } });

    if (!superAdminRole) {
      console.error('❌ Rôle super-admin introuvable. Lancez Strapi une première fois.');
      process.exit(1);
    }

    const hashedPassword = await strapi.service('admin::auth').hashPassword(ADMIN_PASSWORD);
    admin = await strapi.db.query('admin::user').create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        firstname: 'Admin',
        lastname: 'Pairemancipation',
        isActive: true,
        roles: [superAdminRole.id],
      },
    });
    console.log(`✅ Admin créé : ${admin.email}\n`);
  } else {
    console.log(`✅ Admin trouvé : ${admin.email}\n`);
  }

  // --- Demo front-end user (users-permissions) ---
  console.log('👤 Création de l\'utilisateur de démo...');
  const existingUser = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({ where: { email: DEMO_USER_EMAIL } });

  if (existingUser) {
    console.log(`   ⏭  ${DEMO_USER_EMAIL} (existe déjà)\n`);
  } else {
    const authenticatedRole = await strapi.db
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'authenticated' } });

    if (!authenticatedRole) {
      console.error('   ❌ Rôle "authenticated" introuvable.');
    } else {
      await strapi.db.query('plugin::users-permissions.user').create({
        data: {
          username: DEMO_USER_USERNAME,
          email: DEMO_USER_EMAIL,
          password: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
          provider: 'local',
          confirmed: true,
          blocked: false,
          role: authenticatedRole.id,
        },
      });
      console.log(`   ✅ Utilisateur démo créé : ${DEMO_USER_EMAIL}\n`);
    }
  }

  // --- Blog Categories ---
  console.log('📁 Création des catégories de blog...');
  const createdCategories = [];
  for (const cat of blogCategories) {
    const existing = await strapi.documents('api::blog-category.blog-category').findFirst({
      filters: { slug: slugify(cat.name) },
    });
    if (existing) {
      createdCategories.push(existing);
      console.log(`   ⏭  ${cat.name} (existe déjà)`);
    } else {
      const created = await strapi.documents('api::blog-category.blog-category').create({
        data: { ...cat, slug: slugify(cat.name) },
      });
      createdCategories.push(created);
      console.log(`   ✅ ${cat.name}`);
    }
  }

  // --- Tags ---
  console.log('\n🏷  Création des tags...');
  const createdTags = [];
  for (const tagName of tags) {
    const existing = await strapi.documents('api::tag.tag').findFirst({
      filters: { slug: slugify(tagName) },
    });
    if (existing) {
      createdTags.push(existing);
      console.log(`   ⏭  ${tagName} (existe déjà)`);
    } else {
      const created = await strapi.documents('api::tag.tag').create({
        data: { name: tagName, slug: slugify(tagName) },
      });
      createdTags.push(created);
      console.log(`   ✅ ${tagName}`);
    }
  }

  // --- Knowledge Categories ---
  console.log('\n📚 Création des catégories de ressources...');
  for (const cat of knowledgeCategories) {
    const existing = await strapi.documents('api::knowledge-category.knowledge-category').findFirst({
      filters: { slug: slugify(cat.name) },
    });
    if (existing) {
      console.log(`   ⏭  ${cat.name} (existe déjà)`);
    } else {
      await strapi.documents('api::knowledge-category.knowledge-category').create({
        data: { ...cat, slug: slugify(cat.name) },
      });
      console.log(`   ✅ ${cat.name}`);
    }
  }

  // --- Service Types ---
  console.log('\n🏥 Création des types de services...');
  const createdServiceTypes = [];
  for (const st of serviceTypes) {
    const existing = await strapi.documents('api::service-type.service-type').findFirst({
      filters: { slug: slugify(st.name) },
    });
    if (existing) {
      createdServiceTypes.push(existing);
      console.log(`   ⏭  ${st.name} (existe déjà)`);
    } else {
      const created = await strapi.documents('api::service-type.service-type').create({
        data: { ...st, slug: slugify(st.name) },
      });
      createdServiceTypes.push(created);
      console.log(`   ✅ ${st.name}`);
    }
  }

  // --- Structures ---
  console.log('\n🏢 Création des structures...');
  const createdStructures = [];
  for (const struct of structures) {
    const existing = await strapi.documents('api::structure.structure').findFirst({
      filters: { slug: slugify(struct.name) },
    });
    if (existing) {
      createdStructures.push(existing);
      console.log(`   ⏭  ${struct.name} (existe déjà)`);
    } else {
      const { serviceIndices, ...rest } = struct;
      const created = await strapi.documents('api::structure.structure').create({
        data: {
          ...rest,
          slug: slugify(struct.name),
          description: blocksText(struct.description),
          isVerified: true,
          services: serviceIndices.map((i) => createdServiceTypes[i]?.documentId).filter(Boolean),
        },
        status: 'published',
      });
      createdStructures.push(created);
      console.log(`   ✅ ${struct.name}`);
    }
  }

  // --- Blog Articles ---
  console.log('\n📝 Création des articles de blog...');
  for (const article of blogArticles) {
    const slug = slugify(article.title);
    const existing = await strapi.documents('api::blog-article.blog-article').findFirst({
      filters: { slug },
    });
    if (existing) {
      console.log(`   ⏭  ${article.title} (existe déjà)`);
    } else {
      await strapi.documents('api::blog-article.blog-article').create({
        data: {
          title: article.title,
          slug,
          excerpt: article.excerpt,
          content: blocksText(article.excerpt + ' Contenu détaillé de l\'article à rédiger.'),
          category: createdCategories[article.categoryIdx]?.documentId,
          tags: article.tagIndices.map((i) => createdTags[i]?.documentId).filter(Boolean),
          status: 'published',
        },
        status: 'published',
      });
      console.log(`   ✅ ${article.title}`);
    }
  }

  // --- Events ---
  console.log('\n📅 Création des événements...');
  const now = new Date();
  for (const event of events) {
    const slug = slugify(event.title);
    const existing = await strapi.documents('api::event.event').findFirst({
      filters: { slug },
    });
    if (existing) {
      console.log(`   ⏭  ${event.title} (existe déjà)`);
    } else {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() + event.startDaysFromNow);
      startDate.setHours(9, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + event.durationHours);

      const data = {
        title: event.title,
        slug,
        description: blocksText(`Événement organisé par ${event.organizer} à ${event.city}.`),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        isAllDay: false,
        eventType: event.eventType,
        organizer: event.organizer,
        isOnline: event.isOnline || false,
        status: 'published',
      };

      if (event.structureIdx !== undefined && createdStructures[event.structureIdx]) {
        data.structure = createdStructures[event.structureIdx].documentId;
      }

      if (!event.isOnline && event.structureIdx !== undefined) {
        const struct = structures[event.structureIdx];
        if (struct) {
          data.location = struct.address;
        }
      }

      await strapi.documents('api::event.event').create({
        data,
        status: 'published',
      });
      console.log(`   ✅ ${event.title}`);
    }
  }

  // --- News Items ---
  console.log('\n📰 Création des actualités...');
  for (const news of newsItems) {
    const slug = slugify(news.title);
    const existing = await strapi.documents('api::news-item.news-item').findFirst({
      filters: { slug },
    });
    if (existing) {
      console.log(`   ⏭  ${news.title} (existe déjà)`);
    } else {
      await strapi.documents('api::news-item.news-item').create({
        data: {
          title: news.title,
          slug,
          excerpt: news.excerpt,
          content: blocksText(news.excerpt),
          source: news.source,
        },
        status: 'published',
      });
      console.log(`   ✅ ${news.title}`);
    }
  }

  // --- Assessment Templates (upsert : crée ou met à jour) ---
  console.log('\n📊 Création / mise à jour des modèles d\'autoévaluation...');
  for (const tpl of assessmentTemplates) {
    const tplData = {
      name: tpl.name,
      slug: tpl.slug,
      description: tpl.description,
      version: tpl.version,
      scoringMethod: tpl.scoringMethod,
      dimensions: tpl.dimensions,
      questions: tpl.questions.map((q) => ({ ...q, isRequired: true })),
      isActive: true,
    };

    const existing = await strapi.documents('api::assessment-template.assessment-template').findFirst({
      filters: { slug: tpl.slug },
    });
    if (existing) {
      await strapi.documents('api::assessment-template.assessment-template').update({
        documentId: existing.documentId,
        data: tplData,
      });
      console.log(`   🔄 ${tpl.name} (mis à jour + réactivé)`);
    } else {
      await strapi.documents('api::assessment-template.assessment-template').create({
        data: tplData,
      });
      console.log(`   ✅ ${tpl.name}`);
    }
  }

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('   Résumé :');
  console.log(`   - ${blogCategories.length} catégories de blog`);
  console.log(`   - ${tags.length} tags`);
  console.log(`   - ${knowledgeCategories.length} catégories de ressources`);
  console.log(`   - ${serviceTypes.length} types de services`);
  console.log(`   - ${structures.length} structures`);
  console.log(`   - ${blogArticles.length} articles de blog`);
  console.log(`   - ${events.length} événements`);
  console.log(`   - ${newsItems.length} actualités`);
  console.log(`   - ${assessmentTemplates.length} modèles d'autoévaluation`);

  await strapi.destroy();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
