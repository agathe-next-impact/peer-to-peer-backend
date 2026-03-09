'use strict';

/**
 * Service d'agrégation pour le suivi du rétablissement.
 *
 * Collecte les données de tous les outils utilisés par l'utilisateur
 * et calcule des scores d'évolution par module :
 *
 *  - Se connaître : auto-évaluations, observations de situations, signaux d'alerte
 *  - Agir : objectifs personnels, résolution de problèmes
 *  - Gérer : journal, check-ins bien-être, agenda
 *  - Profil : profil de rétablissement, profil autodéterminé
 */

const STABILITY_ORDER = ['crisis', 'fragile', 'stabilizing', 'stable', 'thriving'];
const RECOVERY_STAGE_ORDER = ['moratorium', 'awareness', 'preparation', 'rebuilding', 'growth'];
const MOOD_SCORE = { very_bad: 1, bad: 2, neutral: 3, good: 4, very_good: 5 };

module.exports = ({ strapi }) => ({

  /**
   * Agrège toutes les données d'un utilisateur et retourne un bilan complet.
   * @param {number} userId
   * @param {object} [options]
   * @param {string} [options.since] - ISO date, limite les données à cette période
   * @returns {Promise<object>} Le bilan agrégé
   */
  async aggregate(userId, options = {}) {
    const since = options.since || null;
    const dateFilter = since ? { date: { $gte: since } } : {};
    const createdFilter = since ? { createdAt: { $gte: since } } : {};

    // Collecter toutes les données en parallèle
    const [
      selfAssessments,
      goals,
      notebooks,
      wellnessCheckins,
      observations,
      objectives,
      problemSolvings,
      earlyWarningSigns,
      calendarEvents,
      recoveryProfile,
      selfDeterminedProfile,
      previousTrackings,
    ] = await Promise.all([
      this._findOwned('api::self-assessment.self-assessment', userId, {
        filters: dateFilter,
        sort: { date: 'asc' },
        populate: { template: { fields: ['name', 'slug'] } },
      }),
      this._findOwned('api::personal-goal.personal-goal', userId, {
        filters: createdFilter,
      }),
      this._findOwned('api::personal-notebook.personal-notebook', userId, {
        filters: dateFilter,
        sort: { date: 'desc' },
        limit: 30,
      }),
      this._findOwned('api::wellness-checkin.wellness-checkin', userId, {
        filters: dateFilter,
        sort: { date: 'desc' },
        limit: 30,
      }),
      this._findOwned('api::situation-observation.situation-observation', userId, {
        filters: dateFilter,
        sort: { date: 'desc' },
      }),
      this._findOwned('api::situation-objective.situation-objective', userId, {
        filters: createdFilter,
      }),
      this._findOwned('api::self-problem-solving.self-problem-solving', userId, {
        filters: createdFilter,
      }),
      this._findOwned('api::early-warning-sign.early-warning-sign', userId, {}),
      this._findOwned('api::personal-calendar-event.personal-calendar-event', userId, {
        filters: createdFilter,
        limit: 50,
      }),
      this._findOneOwned('api::recovery-profile.recovery-profile', userId),
      this._findOneOwned('api::self-determined-profile.self-determined-profile', userId),
      this._findOwned('api::recovery-tracking.recovery-tracking', userId, {
        sort: { date: 'desc' },
        limit: 5,
      }),
    ]);

    // Calculer les scores par module
    const seConnaitreScore = this._computeSeConnaitreScore(selfAssessments, observations, earlyWarningSigns, selfDeterminedProfile);
    const agirScore = this._computeAgirScore(goals, problemSolvings, objectives);
    const gererScore = this._computeGererScore(notebooks, wellnessCheckins, calendarEvents);
    const profilScore = this._computeProfilScore(recoveryProfile, selfDeterminedProfile);

    const moduleScores = {
      se_connaitre: seConnaitreScore,
      agir: agirScore,
      gerer: gererScore,
      profil: profilScore,
    };

    // Score global pondéré
    const weights = { se_connaitre: 0.3, agir: 0.3, gerer: 0.2, profil: 0.2 };
    const overallScore = Math.round(
      Object.entries(moduleScores).reduce((sum, [key, mod]) => sum + mod.score * weights[key], 0)
    );

    // Utilisation des outils
    const toolUsage = this._computeToolUsage({
      selfAssessments,
      goals,
      notebooks,
      wellnessCheckins,
      observations,
      objectives,
      problemSolvings,
      earlyWarningSigns,
      calendarEvents,
    });

    // Évolution par rapport aux bilans précédents
    const evolution = this._computeEvolution(overallScore, moduleScores, previousTrackings);

    // Stade de rétablissement (du recovery-profile)
    const recoveryStage = recoveryProfile?.recoveryStage || null;

    return {
      date: new Date().toISOString().split('T')[0],
      overallScore,
      recoveryStage,
      stabilityTrend: evolution.trend,
      moduleScores,
      toolUsage,
      evolution,
    };
  },

  // ─── Scores par module ──────────────────────────────────────────────

  /**
   * Module "Se connaître" : auto-évaluations + observations + signaux d'alerte
   */
  _computeSeConnaitreScore(assessments, observations, warningSigns, selfDeterminedProfile) {
    let score = 0;
    const details = {};

    // 1. Auto-évaluations : régularité + évolution des scores
    if (assessments.length > 0) {
      details.assessmentCount = assessments.length;
      const scores = assessments.filter(a => a.globalScore != null).map(a => Number(a.globalScore));
      if (scores.length >= 2) {
        const first = scores.slice(0, Math.ceil(scores.length / 2));
        const second = scores.slice(Math.ceil(scores.length / 2));
        const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
        const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;
        details.assessmentTrend = avgSecond > avgFirst ? 'improving' : avgSecond < avgFirst ? 'declining' : 'stable';
        details.latestScore = scores[scores.length - 1];
      }
      score += Math.min(30, assessments.length * 10);
    }

    // 2. Observations de situations : engagement dans la connaissance de soi
    if (observations.length > 0) {
      details.observationCount = observations.length;
      const avgIntensity = observations.reduce((sum, o) => sum + (o.intensity || 0), 0) / observations.length;
      details.avgIntensity = Math.round(avgIntensity * 10) / 10;
      score += Math.min(30, observations.length * 5);
    }

    // 3. Signaux d'alerte configurés : conscience de soi
    if (warningSigns.length > 0) {
      const allSigns = warningSigns.flatMap(ws => {
        if (Array.isArray(ws.signs)) return ws.signs;
        return [];
      });
      details.warningSignsCount = allSigns.length;
      details.activeWarningSignsCount = allSigns.filter(s => s.isActive).length;
      score += allSigns.length > 0 ? 20 : 0;
    }

    // 4. Profil autodéterminé complété
    if (selfDeterminedProfile?.onboardingCompletedAt) {
      details.onboardingCompleted = true;
      score += 20;
    }

    return { score: Math.min(100, score), details };
  },

  /**
   * Module "Agir" : objectifs + résolution de problèmes + objectifs situation
   */
  _computeAgirScore(goals, problemSolvings, situationObjectives) {
    let score = 0;
    const details = {};

    // 1. Objectifs personnels
    if (goals.length > 0) {
      const completed = goals.filter(g => g.status === 'completed').length;
      const inProgress = goals.filter(g => g.status === 'in_progress').length;
      const avgProgress = goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length;

      details.goalCount = goals.length;
      details.completedGoals = completed;
      details.inProgressGoals = inProgress;
      details.avgGoalProgress = Math.round(avgProgress);
      details.completionRate = Math.round((completed / goals.length) * 100);

      score += Math.min(40, details.completionRate * 0.4);
      score += inProgress > 0 ? 10 : 0;
    }

    // 2. Résolution de problèmes
    if (problemSolvings.length > 0) {
      const completed = problemSolvings.filter(p => p.status === 'completed').length;
      const successful = problemSolvings.filter(p => p.reviewOutcome === 'success').length;

      details.problemSolvingCount = problemSolvings.length;
      details.completedProblemSolvings = completed;
      details.successfulOutcomes = successful;

      score += Math.min(30, completed * 10);
      score += successful * 5;
    }

    // 3. Objectifs liés aux situations
    if (situationObjectives.length > 0) {
      const completed = situationObjectives.filter(o => o.status === 'completed').length;
      details.situationObjectiveCount = situationObjectives.length;
      details.completedObjectives = completed;
      score += Math.min(20, completed * 5);
    }

    return { score: Math.min(100, score), details };
  },

  /**
   * Module "Gérer" : journal + check-ins bien-être + agenda
   */
  _computeGererScore(notebooks, wellnessCheckins, calendarEvents) {
    let score = 0;
    const details = {};

    // 1. Journal : régularité d'écriture + tendance de l'humeur
    if (notebooks.length > 0) {
      details.notebookEntryCount = notebooks.length;
      const moods = notebooks.filter(n => n.mood).map(n => MOOD_SCORE[n.mood] || 3);
      if (moods.length > 0) {
        details.avgMood = Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10;
      }
      score += Math.min(30, notebooks.length * 3);
    }

    // 2. Check-ins bien-être : régularité
    if (wellnessCheckins.length > 0) {
      details.checkinCount = wellnessCheckins.length;
      const moods = wellnessCheckins.filter(c => c.overallMood != null).map(c => c.overallMood);
      if (moods.length >= 2) {
        const firstHalf = moods.slice(Math.floor(moods.length / 2));
        const secondHalf = moods.slice(0, Math.floor(moods.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        details.wellnessTrend = avgSecond > avgFirst ? 'improving' : avgSecond < avgFirst ? 'declining' : 'stable';
      }
      score += Math.min(40, wellnessCheckins.length * 4);
    }

    // 3. Agenda : utilisation proactive
    if (calendarEvents.length > 0) {
      details.calendarEventCount = calendarEvents.length;
      score += Math.min(30, calendarEvents.length * 3);
    }

    return { score: Math.min(100, score), details };
  },

  /**
   * Module "Profil" : complétude du profil de rétablissement + profil autodéterminé
   */
  _computeProfilScore(recoveryProfile, selfDeterminedProfile) {
    let score = 0;
    const details = {};

    if (recoveryProfile) {
      const fields = ['selfDeterminedNeeds', 'strengths', 'preferences', 'wellnessDefinition', 'dreams', 'emergencyContacts', 'copingStrategies'];
      const filledFields = fields.filter(f => {
        const val = recoveryProfile[f];
        if (val == null) return false;
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === 'string') return val.trim().length > 0;
        if (typeof val === 'object') return Object.keys(val).length > 0;
        return true;
      });

      details.profileCompleteness = Math.round((filledFields.length / fields.length) * 100);
      details.recoveryStage = recoveryProfile.recoveryStage;
      details.crisisPlanStatus = recoveryProfile.crisisPlanStatus;

      score += details.profileCompleteness * 0.5;

      // Bonus pour stade avancé
      const stageIndex = RECOVERY_STAGE_ORDER.indexOf(recoveryProfile.recoveryStage);
      if (stageIndex >= 0) score += stageIndex * 5;
    }

    if (selfDeterminedProfile) {
      const axes = ['wellnessCompass', 'strengthsIdentification', 'vulnerabilitiesBalance', 'functionalAssessment'];
      const filledAxes = axes.filter(a => selfDeterminedProfile[a] != null);
      details.selfDeterminedAxes = filledAxes.length;
      details.stabilityLevel = selfDeterminedProfile.stabilityLevel;

      score += filledAxes.length * 5;

      const stabilityIndex = STABILITY_ORDER.indexOf(selfDeterminedProfile.stabilityLevel);
      if (stabilityIndex >= 0) score += stabilityIndex * 5;
    }

    return { score: Math.min(100, score), details };
  },

  // ─── Utilisation des outils ─────────────────────────────────────────

  _computeToolUsage(data) {
    const tools = [
      { key: 'selfAssessments', label: 'Auto-évaluations', section: 'se_connaitre' },
      { key: 'observations', label: 'Décodeur de situations', section: 'se_connaitre' },
      { key: 'objectives', label: 'Objectifs de situation', section: 'se_connaitre' },
      { key: 'earlyWarningSigns', label: 'Signaux avant-coureurs', section: 'se_connaitre' },
      { key: 'goals', label: 'Objectifs personnels', section: 'agir' },
      { key: 'problemSolvings', label: 'Atelier des Solutions', section: 'agir' },
      { key: 'notebooks', label: 'Journal de bord', section: 'gerer' },
      { key: 'wellnessCheckins', label: 'Check-ins bien-être', section: 'gerer' },
      { key: 'calendarEvents', label: 'Agenda personnel', section: 'gerer' },
    ];

    return tools.map(tool => ({
      key: tool.key,
      label: tool.label,
      section: tool.section,
      count: Array.isArray(data[tool.key]) ? data[tool.key].length : 0,
      isUsed: Array.isArray(data[tool.key]) && data[tool.key].length > 0,
    }));
  },

  // ─── Évolution ──────────────────────────────────────────────────────

  _computeEvolution(currentScore, currentModuleScores, previousTrackings) {
    if (!previousTrackings || previousTrackings.length === 0) {
      return { trend: 'stable', previousScore: null, scoreDelta: 0, moduleDeltas: {} };
    }

    const previous = previousTrackings[0];
    const scoreDelta = currentScore - (previous.overallScore || 0);

    let trend = 'stable';
    if (scoreDelta > 5) trend = 'improving';
    else if (scoreDelta < -5) trend = 'declining';

    const moduleDeltas = {};
    if (previous.moduleScores) {
      for (const [key, mod] of Object.entries(currentModuleScores)) {
        const prevMod = previous.moduleScores[key];
        if (prevMod) {
          moduleDeltas[key] = mod.score - (prevMod.score || 0);
        }
      }
    }

    return {
      trend,
      previousScore: previous.overallScore,
      previousDate: previous.date,
      scoreDelta,
      moduleDeltas,
    };
  },

  // ─── Helpers ────────────────────────────────────────────────────────

  async _findOwned(uid, userId, queryOptions = {}) {
    try {
      const { results } = await strapi.service(uid).find({
        ...queryOptions,
        filters: {
          ...(queryOptions.filters || {}),
          owner: { id: userId },
        },
        pagination: queryOptions.limit ? { limit: queryOptions.limit } : { limit: 100 },
      });
      return results || [];
    } catch {
      return [];
    }
  },

  async _findOneOwned(uid, userId) {
    try {
      const { results } = await strapi.service(uid).find({
        filters: { owner: { id: userId } },
        pagination: { limit: 1 },
      });
      return results?.[0] || null;
    } catch {
      return null;
    }
  },
});
