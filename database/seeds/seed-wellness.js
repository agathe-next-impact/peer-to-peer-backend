'use strict';

/**
 * Seed de données de démonstration — Module "Mon Équilibre"
 *
 * Crée 14 jours de check-ins wellness + une config tracker
 * pour l'utilisateur spécifié par SEED_WELLNESS_EMAIL.
 *
 * Les champs JSON (data, settings) seront chiffrés automatiquement
 * par les lifecycle hooks si ENCRYPTION_KEY est définie.
 *
 * Usage :
 *   SEED_WELLNESS_EMAIL=agathe@next-impact.digital \
 *   npm run seed:wellness --workspace=apps/backend
 */

const { createStrapi } = require('@strapi/strapi');

const TARGET_EMAIL = process.env.SEED_WELLNESS_EMAIL || 'agathe@next-impact.digital';

// ---------------------------------------------------------------------------
// 14 jours de données réalistes et variées
// Scénario : une personne en parcours de rétablissement avec des hauts et
// des bas, une amélioration progressive du sommeil, quelques consommations
// en début de période qui diminuent, et une activité physique irrégulière
// qui se régularise vers la fin.
// ---------------------------------------------------------------------------

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

const wellnessCheckins = [
  // --- Jour -14 : début difficile ---
  {
    date: daysAgo(14),
    overallMood: 3,
    data: {
      sleep: { hours: 4.5, quality: 'tired' },
      nutrition: { type: 'snacking', hydration: 2 },
      toxics: { alcohol: 3, tobacco: 5, custom: {} },
      activity: { done: false, note: '' },
      workload: 'overloaded',
    },
  },
  // --- Jour -13 : toujours difficile ---
  {
    date: daysAgo(13),
    overallMood: 3,
    data: {
      sleep: { hours: 5, quality: 'tired' },
      nutrition: { type: 'quick', hydration: 3 },
      toxics: { alcohol: 2, tobacco: 4, custom: {} },
      activity: { done: false, note: '' },
      workload: 'overloaded',
    },
  },
  // --- Jour -12 : léger mieux ---
  {
    date: daysAgo(12),
    overallMood: 4,
    data: {
      sleep: { hours: 5.5, quality: 'tired' },
      nutrition: { type: 'quick', hydration: 4 },
      toxics: { alcohol: 1, tobacco: 3, custom: {} },
      activity: { done: true, note: 'Petite marche 15 min' },
      workload: 'overloaded',
    },
  },
  // --- Jour -11 : jour de repos ---
  {
    date: daysAgo(11),
    overallMood: 5,
    data: {
      sleep: { hours: 7, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 5 },
      toxics: { alcohol: 0, tobacco: 2, custom: {} },
      activity: { done: true, note: 'Lecture, café avec un ami' },
      workload: 'off',
    },
  },
  // --- Jour -10 : retour au travail, mais mieux ---
  {
    date: daysAgo(10),
    overallMood: 5,
    data: {
      sleep: { hours: 6.5, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 6 },
      toxics: { alcohol: 0, tobacco: 2, custom: {} },
      activity: { done: false, note: '' },
      workload: 'normal',
    },
  },
  // --- Jour -9 : journée productive ---
  {
    date: daysAgo(9),
    overallMood: 6,
    data: {
      sleep: { hours: 7, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 7 },
      toxics: { alcohol: 0, tobacco: 1, custom: {} },
      activity: { done: true, note: 'Yoga 30 min' },
      workload: 'normal',
    },
  },
  // --- Jour -8 : rechute légère après soirée ---
  {
    date: daysAgo(8),
    overallMood: 4,
    data: {
      sleep: { hours: 5, quality: 'tired' },
      nutrition: { type: 'snacking', hydration: 2 },
      toxics: { alcohol: 4, tobacco: 3, custom: {} },
      activity: { done: false, note: '' },
      workload: 'normal',
    },
  },
  // --- Jour -7 : lendemain difficile ---
  {
    date: daysAgo(7),
    overallMood: 3,
    data: {
      sleep: { hours: 5.5, quality: 'tired' },
      nutrition: { type: 'quick', hydration: 3 },
      toxics: { alcohol: 0, tobacco: 2, custom: {} },
      activity: { done: false, note: '' },
      workload: 'overloaded',
    },
  },
  // --- Jour -6 : reprise en main ---
  {
    date: daysAgo(6),
    overallMood: 5,
    data: {
      sleep: { hours: 7, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 6 },
      toxics: { alcohol: 0, tobacco: 1, custom: {} },
      activity: { done: true, note: 'Marche 45 min au parc' },
      workload: 'normal',
    },
  },
  // --- Jour -5 : bonne journée ---
  {
    date: daysAgo(5),
    overallMood: 7,
    data: {
      sleep: { hours: 7.5, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 7 },
      toxics: { alcohol: 0, tobacco: 0, custom: {} },
      activity: { done: true, note: 'Course à pied 20 min' },
      workload: 'normal',
    },
  },
  // --- Jour -4 : très bonne journée ---
  {
    date: daysAgo(4),
    overallMood: 7,
    data: {
      sleep: { hours: 8, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 8 },
      toxics: { alcohol: 0, tobacco: 0, custom: {} },
      activity: { done: true, note: 'Natation 1h' },
      workload: 'off',
    },
  },
  // --- Jour -3 : bon rythme maintenu ---
  {
    date: daysAgo(3),
    overallMood: 6,
    data: {
      sleep: { hours: 7, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 6 },
      toxics: { alcohol: 1, tobacco: 0, custom: {} },
      activity: { done: true, note: 'Vélo 30 min' },
      workload: 'normal',
    },
  },
  // --- Jour -2 : journée chargée mais bien gérée ---
  {
    date: daysAgo(2),
    overallMood: 6,
    data: {
      sleep: { hours: 6.5, quality: 'good' },
      nutrition: { type: 'quick', hydration: 5 },
      toxics: { alcohol: 0, tobacco: 0, custom: {} },
      activity: { done: false, note: '' },
      workload: 'overloaded',
    },
  },
  // --- Hier : bonne fin de semaine ---
  {
    date: daysAgo(1),
    overallMood: 8,
    data: {
      sleep: { hours: 8, quality: 'good' },
      nutrition: { type: 'balanced', hydration: 8 },
      toxics: { alcohol: 0, tobacco: 0, custom: {} },
      activity: { done: true, note: 'Randonnée en forêt 2h' },
      workload: 'off',
    },
  },
];

const trackerConfig = {
  enabledCategories: ['sleep', 'nutrition', 'toxics', 'activity', 'workload'],
  customToxics: [],
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function seedWellness() {
  console.log('⚡ Seed Mon Équilibre — données de démonstration\n');
  console.log(`   Utilisateur cible : ${TARGET_EMAIL}`);
  console.log(`   Période : ${wellnessCheckins.length} jours\n`);

  const appContext = await createStrapi({ distDir: './dist' }).load();
  const strapi = appContext;

  // Find the target user
  const user = await strapi.db
    .query('plugin::users-permissions.user')
    .findOne({ where: { email: TARGET_EMAIL } });

  if (!user) {
    console.error(`❌ Utilisateur non trouvé : ${TARGET_EMAIL}`);
    console.error('   Vérifiez que l\'utilisateur existe dans la base de données.');
    await strapi.destroy();
    process.exit(1);
  }

  console.log(`   ✅ Utilisateur trouvé : ${user.username} (id: ${user.id})\n`);

  // --- Tracker Config ---
  console.log('⚙️  Configuration du tracker...');
  const existingConfig = await strapi.documents('api::wellness-tracker-config.wellness-tracker-config').findMany({
    filters: { owner: user.id },
  });

  if (existingConfig.length > 0) {
    await strapi.documents('api::wellness-tracker-config.wellness-tracker-config').update({
      documentId: existingConfig[0].documentId,
      data: {
        settings: trackerConfig,
        owner: user.id,
      },
    });
    console.log('   🔄 Config mise à jour\n');
  } else {
    await strapi.documents('api::wellness-tracker-config.wellness-tracker-config').create({
      data: {
        settings: trackerConfig,
        owner: user.id,
      },
    });
    console.log('   ✅ Config créée\n');
  }

  // --- Wellness Check-ins ---
  console.log('📊 Création des check-ins...');

  // Delete existing check-ins for this user to avoid duplicates
  const existingCheckins = await strapi.documents('api::wellness-checkin.wellness-checkin').findMany({
    filters: { owner: user.id },
  });

  if (existingCheckins.length > 0) {
    console.log(`   🗑  Suppression de ${existingCheckins.length} check-ins existants...`);
    for (const existing of existingCheckins) {
      await strapi.documents('api::wellness-checkin.wellness-checkin').delete({
        documentId: existing.documentId,
      });
    }
  }

  // Create new check-ins
  for (const checkin of wellnessCheckins) {
    await strapi.documents('api::wellness-checkin.wellness-checkin').create({
      data: {
        date: checkin.date,
        data: checkin.data,
        overallMood: checkin.overallMood,
        owner: user.id,
      },
    });

    const moodEmoji = ['', '😞', '😔', '😕', '🙁', '😐', '🙂', '😊', '😄', '😁', '🤩'][checkin.overallMood] || '';
    const sleepStr = checkin.data.sleep ? `${checkin.data.sleep.hours}h` : '-';
    const toxStr = checkin.data.toxics ? `${checkin.data.toxics.alcohol + checkin.data.toxics.tobacco} conso` : '-';
    console.log(`   ✅ ${checkin.date}  ${moodEmoji} ${checkin.overallMood}/10  |  🛏 ${sleepStr}  |  🚬 ${toxStr}`);
  }

  console.log(`\n🎉 Seed terminé ! ${wellnessCheckins.length} check-ins créés.`);
  console.log('\n   Résumé du scénario :');
  console.log('   - J-14 à J-12 : période difficile (peu de sommeil, surcharge, consommations)');
  console.log('   - J-11 : jour de repos, amorce de reprise');
  console.log('   - J-10 à J-9 : amélioration progressive');
  console.log('   - J-8 à J-7 : légère rechute après une soirée');
  console.log('   - J-6 à J-1 : reprise en main, tendance positive');
  console.log('   → Le moteur d\'insights devrait détecter :');
  console.log('     • Corrélation sommeil/humeur');
  console.log('     • Corrélation activité/humeur');
  console.log('     • Amélioration de l\'humeur semaine récente vs précédente');
  console.log('     • Baisse des consommations');

  await strapi.destroy();
  process.exit(0);
}

seedWellness().catch((err) => {
  console.error('❌ Erreur lors du seed :', err);
  process.exit(1);
});
