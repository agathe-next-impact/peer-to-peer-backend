'use strict';

/**
 * Moteur de suggestions pour l'orientation du parcours de rétablissement.
 *
 * Analyse le bilan agrégé et génère des suggestions personnalisées :
 *  - Outils sous-utilisés à découvrir
 *  - Actions correctives en cas de baisse
 *  - Prochaines étapes adaptées au stade de rétablissement
 *  - Renforcement des points forts
 */

const RECOVERY_STAGES = ['moratorium', 'awareness', 'preparation', 'rebuilding', 'growth'];

/**
 * Suggestions par stade de rétablissement (STORI model).
 * Chaque stade a des priorités et outils recommandés différents.
 */
const STAGE_GUIDANCE = {
  moratorium: {
    priority: 'stabilisation',
    description: 'Phase de survie — priorité à la stabilisation et au soutien immédiat.',
    recommendedTools: ['wellnessCheckins', 'earlyWarningSigns', 'notebooks'],
    suggestedActions: [
      'Compléter votre plan de crise et vos contacts d\'urgence',
      'Utiliser le check-in bien-être quotidien pour suivre votre état',
      'Identifier vos signaux avant-coureurs',
      'Écrire dans votre journal, même quelques mots par jour',
    ],
  },
  awareness: {
    priority: 'connaissance_de_soi',
    description: 'Phase de prise de conscience — comprendre votre situation et vos besoins.',
    recommendedTools: ['selfAssessments', 'observations', 'earlyWarningSigns', 'notebooks'],
    suggestedActions: [
      'Réaliser une auto-évaluation pour mieux comprendre votre état',
      'Utiliser le décodeur de situations pour identifier vos déclencheurs',
      'Compléter votre profil autodéterminé (Le Chemin)',
      'Documenter vos forces et vos qualités',
    ],
  },
  preparation: {
    priority: 'planification',
    description: 'Phase de préparation — définir vos objectifs et planifier vos actions.',
    recommendedTools: ['goals', 'selfAssessments', 'problemSolvings', 'calendarEvents'],
    suggestedActions: [
      'Définir des objectifs à court terme réalistes',
      'Utiliser l\'Atelier des Solutions pour les défis concrets',
      'Planifier des activités dans votre agenda',
      'Faire le point régulièrement avec des auto-évaluations',
    ],
  },
  rebuilding: {
    priority: 'action',
    description: 'Phase de reconstruction — mettre en œuvre vos plans et renforcer vos acquis.',
    recommendedTools: ['goals', 'problemSolvings', 'objectives', 'calendarEvents'],
    suggestedActions: [
      'Suivre la progression de vos objectifs en cours',
      'Définir des objectifs à moyen et long terme',
      'Célébrer vos réussites dans votre journal',
      'Revoir et ajuster vos plans d\'action',
    ],
  },
  growth: {
    priority: 'épanouissement',
    description: 'Phase de croissance — consolider et partager votre expérience.',
    recommendedTools: ['goals', 'selfAssessments', 'notebooks', 'calendarEvents'],
    suggestedActions: [
      'Fixer des objectifs ambitieux alignés avec vos rêves',
      'Partager votre parcours avec la communauté',
      'Réévaluer régulièrement votre bien-être global',
      'Maintenir vos routines de bien-être',
    ],
  },
};

module.exports = ({ strapi }) => ({

  /**
   * Génère des suggestions personnalisées basées sur le bilan agrégé.
   * @param {object} aggregation - Le bilan retourné par tracking-aggregator
   * @returns {object} Les suggestions structurées
   */
  generateSuggestions(aggregation) {
    const { moduleScores, toolUsage, evolution, recoveryStage, overallScore } = aggregation;

    const suggestions = [];

    // 1. Suggestions basées sur le stade de rétablissement
    const stageGuidance = this._getStageGuidance(recoveryStage, toolUsage);
    suggestions.push(...stageGuidance);

    // 2. Suggestions basées sur les outils sous-utilisés
    const unusedToolSuggestions = this._getUnusedToolSuggestions(toolUsage, recoveryStage);
    suggestions.push(...unusedToolSuggestions);

    // 3. Suggestions basées sur l'évolution (tendances)
    const trendSuggestions = this._getTrendSuggestions(evolution, moduleScores);
    suggestions.push(...trendSuggestions);

    // 4. Suggestions basées sur les scores par module
    const scoreSuggestions = this._getScoreSuggestions(moduleScores);
    suggestions.push(...scoreSuggestions);

    // 5. Orientation globale
    const orientation = this._computeOrientation(recoveryStage, overallScore, evolution, moduleScores);

    return {
      orientation,
      suggestions,
      stageInfo: STAGE_GUIDANCE[recoveryStage] || null,
    };
  },

  // ─── Guidance par stade ─────────────────────────────────────────────

  _getStageGuidance(recoveryStage, toolUsage) {
    const guidance = STAGE_GUIDANCE[recoveryStage];
    if (!guidance) return [];

    const suggestions = [];
    const usedToolKeys = toolUsage.filter(t => t.isUsed).map(t => t.key);

    // Suggérer les outils recommandés pour ce stade qui ne sont pas utilisés
    for (const recommendedTool of guidance.recommendedTools) {
      if (!usedToolKeys.includes(recommendedTool)) {
        const toolInfo = toolUsage.find(t => t.key === recommendedTool);
        if (toolInfo) {
          suggestions.push({
            type: 'stage_recommendation',
            priority: 'high',
            section: toolInfo.section,
            message: `Pour la phase de ${guidance.priority}, nous vous recommandons d'essayer : ${toolInfo.label}`,
            toolKey: recommendedTool,
          });
        }
      }
    }

    return suggestions;
  },

  // ─── Outils sous-utilisés ──────────────────────────────────────────

  _getUnusedToolSuggestions(toolUsage, recoveryStage) {
    const suggestions = [];
    const unusedTools = toolUsage.filter(t => !t.isUsed);

    // Ne pas submerger : max 2 suggestions d'outils non-utilisés
    const limited = unusedTools.slice(0, 2);
    for (const tool of limited) {
      // Éviter les doublons avec les suggestions de stade
      const guidance = STAGE_GUIDANCE[recoveryStage];
      if (guidance && guidance.recommendedTools.includes(tool.key)) continue;

      suggestions.push({
        type: 'discover_tool',
        priority: 'low',
        section: tool.section,
        message: `Vous n'avez pas encore utilisé : ${tool.label}. Cet outil pourrait enrichir votre parcours.`,
        toolKey: tool.key,
      });
    }

    return suggestions;
  },

  // ─── Tendances ─────────────────────────────────────────────────────

  _getTrendSuggestions(evolution, moduleScores) {
    const suggestions = [];

    if (evolution.trend === 'declining') {
      suggestions.push({
        type: 'trend_alert',
        priority: 'high',
        message: `Votre score global a baissé de ${Math.abs(evolution.scoreDelta)} points depuis le dernier bilan. C'est normal d'avoir des hauts et des bas — l'important est de maintenir vos routines.`,
      });

      // Identifier les modules en baisse
      for (const [key, delta] of Object.entries(evolution.moduleDeltas || {})) {
        if (delta < -10) {
          const labels = { se_connaitre: 'Se connaître', agir: 'Agir', gerer: 'Gérer', profil: 'Profil' };
          suggestions.push({
            type: 'module_decline',
            priority: 'medium',
            section: key,
            message: `Le module "${labels[key]}" a baissé de ${Math.abs(delta)} points. Considérez y consacrer plus d'attention.`,
          });
        }
      }
    }

    if (evolution.trend === 'improving') {
      suggestions.push({
        type: 'encouragement',
        priority: 'low',
        message: `Votre score a progressé de +${evolution.scoreDelta} points. Continuez sur cette lancée !`,
      });
    }

    return suggestions;
  },

  // ─── Scores faibles ────────────────────────────────────────────────

  _getScoreSuggestions(moduleScores) {
    const suggestions = [];
    const labels = { se_connaitre: 'Se connaître', agir: 'Agir', gerer: 'Gérer', profil: 'Profil' };

    for (const [key, mod] of Object.entries(moduleScores)) {
      if (mod.score < 30) {
        suggestions.push({
          type: 'low_score',
          priority: 'medium',
          section: key,
          message: `Votre score pour "${labels[key]}" est de ${mod.score}/100. Utiliser davantage les outils de cette section vous aidera à progresser.`,
        });
      }

      // Suggestions spécifiques basées sur les détails
      if (key === 'agir' && mod.details) {
        if (mod.details.inProgressGoals > 3) {
          suggestions.push({
            type: 'focus',
            priority: 'medium',
            section: 'agir',
            message: `Vous avez ${mod.details.inProgressGoals} objectifs en cours. Pensez à en compléter certains avant d'en ajouter de nouveaux.`,
          });
        }
        if (mod.details.completionRate != null && mod.details.completionRate < 20 && mod.details.goalCount >= 3) {
          suggestions.push({
            type: 'adjustment',
            priority: 'medium',
            section: 'agir',
            message: 'Votre taux de complétion d\'objectifs est faible. Essayez de définir des objectifs plus petits et atteignables.',
          });
        }
      }

      if (key === 'se_connaitre' && mod.details) {
        if (mod.details.assessmentTrend === 'declining') {
          suggestions.push({
            type: 'attention',
            priority: 'high',
            section: 'se_connaitre',
            message: 'Vos scores d\'auto-évaluation montrent une tendance à la baisse. Prenez le temps de faire le point sur votre bien-être.',
          });
        }
      }
    }

    return suggestions;
  },

  // ─── Orientation globale ───────────────────────────────────────────

  /**
   * Calcule l'orientation recommandée pour la suite du parcours.
   */
  _computeOrientation(recoveryStage, overallScore, evolution, moduleScores) {
    const stageIndex = RECOVERY_STAGES.indexOf(recoveryStage);

    // Déterminer si l'utilisateur est prêt à passer au stade suivant
    let readyForNext = false;
    let nextStage = null;

    if (stageIndex >= 0 && stageIndex < RECOVERY_STAGES.length - 1) {
      nextStage = RECOVERY_STAGES[stageIndex + 1];
      // Critères pour passer au stade suivant :
      // - Score global > 60
      // - Tendance stable ou en amélioration
      // - Module prioritaire du stade actuel > 50
      readyForNext = overallScore > 60
        && evolution.trend !== 'declining'
        && this._getPriorityModuleScore(recoveryStage, moduleScores) > 50;
    }

    // Identifier le module le plus faible pour concentration
    const weakestModule = Object.entries(moduleScores)
      .sort(([, a], [, b]) => a.score - b.score)[0];

    // Identifier le module le plus fort pour renforcement
    const strongestModule = Object.entries(moduleScores)
      .sort(([, a], [, b]) => b.score - a.score)[0];

    const labels = { se_connaitre: 'Se connaître', agir: 'Agir', gerer: 'Gérer', profil: 'Profil' };

    const guidance = STAGE_GUIDANCE[recoveryStage] || {};

    return {
      currentStage: recoveryStage,
      currentStageDescription: guidance.description || null,
      readyForNextStage: readyForNext,
      nextStage,
      nextStageDescription: nextStage ? (STAGE_GUIDANCE[nextStage]?.description || null) : null,
      focusArea: weakestModule ? { key: weakestModule[0], label: labels[weakestModule[0]], score: weakestModule[1].score } : null,
      strengthArea: strongestModule ? { key: strongestModule[0], label: labels[strongestModule[0]], score: strongestModule[1].score } : null,
      overallAssessment: this._getOverallAssessment(overallScore, evolution.trend),
    };
  },

  _getPriorityModuleScore(recoveryStage, moduleScores) {
    const priorityMap = {
      moratorium: 'gerer',
      awareness: 'se_connaitre',
      preparation: 'agir',
      rebuilding: 'agir',
      growth: 'profil',
    };
    const priorityModule = priorityMap[recoveryStage];
    return moduleScores[priorityModule]?.score || 0;
  },

  _getOverallAssessment(score, trend) {
    if (score >= 75 && trend !== 'declining') {
      return 'Votre parcours de rétablissement progresse très bien. Continuez à utiliser les outils régulièrement et envisagez de nouveaux défis.';
    }
    if (score >= 50) {
      return 'Vous êtes sur la bonne voie. Concentrez-vous sur les domaines identifiés pour consolider votre progression.';
    }
    if (score >= 25) {
      return 'Votre parcours commence à prendre forme. Essayez d\'utiliser les outils recommandés plus régulièrement pour accélérer votre progression.';
    }
    return 'Vous êtes au début de votre parcours. Chaque petit pas compte — commencez par les outils qui vous parlent le plus.';
  },
});
