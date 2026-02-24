'use strict';

/**
 * Mini-seed — Upsert des modèles d'autoévaluation uniquement.
 * Ne nécessite PAS de credentials admin/demo.
 *
 * Usage :
 *   node database/seeds/seed-templates.js
 */

const { createStrapi } = require('@strapi/strapi');

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

async function main() {
  console.log('🚀 Démarrage Strapi pour upsert des templates...\n');

  const appContext = await createStrapi({ distDir: './dist' }).load();
  const strapi = appContext;

  const UID = 'api::assessment-template.assessment-template';
  let created = 0;
  let updated = 0;

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

    const existing = await strapi.documents(UID).findFirst({
      filters: { slug: tpl.slug },
      populate: ['dimensions', 'questions'],
    });

    if (existing) {
      await strapi.documents(UID).update({
        documentId: existing.documentId,
        data: tplData,
      });
      const qCount = tpl.questions.length;
      const dCount = tpl.dimensions.length;
      console.log(`   🔄 ${tpl.name} — mis à jour (${qCount} questions, ${dCount} dimensions, isActive=true)`);
      updated++;
    } else {
      await strapi.documents(UID).create({ data: tplData });
      console.log(`   ✅ ${tpl.name} — créé`);
      created++;
    }
  }

  console.log(`\n🎉 Terminé : ${created} créé(s), ${updated} mis à jour.`);
  await strapi.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
