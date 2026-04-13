/**
 * VisionField VR — Screening Configuration
 *
 * Alle konfigurerbare tærskler for screeningslogik.
 * INGEN magiske tal i koden — alt defineret her.
 *
 * VIGTIGT: Dette er et screeningsværktøj, IKKE diagnostisk software.
 * Tærsklerne er sat til høj sensitivitet for at minimere falske negative.
 */

export interface ScreeningConfig {
  // ─── Reliability Tærskler ──────────────────────────────────
  reliability: {
    /** Max false positive rate for "godkendt" (default: 0.20) */
    fpRateGood: number;
    /** Max false positive rate for "brugbar med forbehold" (default: 0.33) */
    fpRateCaution: number;
    /** Max false negative rate for "godkendt" */
    fnRateGood: number;
    /** Max false negative rate for "brugbar med forbehold" */
    fnRateCaution: number;
    /** Max fixation loss rate for "godkendt" */
    fixLossGood: number;
    /** Max fixation loss rate for "brugbar med forbehold" */
    fixLossCaution: number;
    /** Min completion rate (andel konvergerede punkter) */
    minCompletionRate: number;
    /** Max median reaktionstid (ms) for stabil test */
    maxMedianResponseTimeMs: number;
  };

  // ─── Deviation Tærskler ────────────────────────────────────
  deviation: {
    /** p < 5% grænse (dB under normativ) — tilpasses per punkt i praksis */
    p5threshold: number;
    /** p < 2% grænse */
    p2threshold: number;
    /** p < 1% grænse */
    p1threshold: number;
    /** p < 0.5% grænse */
    p05threshold: number;
  };

  // ─── Cluster Tærskler ──────────────────────────────────────
  cluster: {
    /** Min antal sammenhængende signifikante punkter for cluster */
    minClusterSize: number;
    /** Min probability level for at indgå i cluster (1=p5, 2=p2, 3=p1, 4=p05) */
    minClusterProbLevel: number;
    /** Inkluder diagonale naboer i cluster-søgning */
    includeDiagonalNeighbors: boolean;
  };

  // ─── Mønster-detektion ─────────────────────────────────────
  pattern: {
    /** Min antal punkter i ét hemifelt for asymmetri-detektion */
    hemifieldMinPoints: number;
    /** Max asymmetri-difference (dB) mellem hemifelter for "normal" */
    hemifieldNormalDiffDb: number;
    /** Min antal signifikante punkter langs vertikal meridian for neuro-mistanke */
    verticalRespectMinPoints: number;
    /** Max afstand fra vertikal meridian (grader) for "respekterer" */
    verticalRespectMaxDegrees: number;
    /** Min MD for generel depression (dB) */
    generalDepressionMdDb: number;
  };

  // ─── Samlet Risikovurdering ────────────────────────────────
  risk: {
    /** MD grænse for "let mistanke" */
    mildSuspicionMdDb: number;
    /** MD grænse for "tydelig mistanke" */
    clearSuspicionMdDb: number;
    /** PSD grænse for "let mistanke" */
    mildSuspicionPsdDb: number;
    /** PSD grænse for "tydelig mistanke" */
    clearSuspicionPsdDb: number;
    /** Min antal clusters for "tydelig mistanke" */
    clearSuspicionMinClusters: number;
  };
}

/** Standard screening-konfiguration — høj sensitivitet */
export const DEFAULT_SCREENING_CONFIG: ScreeningConfig = {
  reliability: {
    fpRateGood: 0.15,
    fpRateCaution: 0.33,
    fnRateGood: 0.20,
    fnRateCaution: 0.33,
    fixLossGood: 0.15,
    fixLossCaution: 0.25,
    minCompletionRate: 0.85,
    maxMedianResponseTimeMs: 800,
  },
  deviation: {
    p5threshold: -3,    // dB under alderskorrigeret normativ
    p2threshold: -5,
    p1threshold: -7,
    p05threshold: -10,
  },
  cluster: {
    minClusterSize: 3,
    minClusterProbLevel: 1, // p < 5% eller dybere
    includeDiagonalNeighbors: false, // Kun ortogonale naboer som standard
  },
  pattern: {
    hemifieldMinPoints: 3,
    hemifieldNormalDiffDb: 3,
    verticalRespectMinPoints: 3,
    verticalRespectMaxDegrees: 5,
    generalDepressionMdDb: -3,
  },
  risk: {
    mildSuspicionMdDb: -2,
    clearSuspicionMdDb: -5,
    mildSuspicionPsdDb: 2.0,
    clearSuspicionPsdDb: 3.5,
    clearSuspicionMinClusters: 2,
  },
};
