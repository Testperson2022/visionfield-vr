/**
 * Screening Data Types
 *
 * Alle typer for screeningsmotor — bruges af både backend og frontend.
 */

// ─── Reliability ─────────────────────────────────────────────

export type ReliabilityGrade = "good" | "caution" | "unreliable";

export interface ReliabilityAssessment {
  grade: ReliabilityGrade;
  falsePositiveRate: number;
  falseNegativeRate: number;
  fixationLossRate: number;
  completionRate: number;
  medianResponseTimeMs: number | null;
  issues: string[];
  /** Kan resultatet tolkes? */
  canInterpret: boolean;
}

// ─── Per-punkt analyse ───────────────────────────────────────

export type ProbabilityClass = "normal" | "p5" | "p2" | "p1" | "p05";

export interface AnalyzedPoint {
  gridPointId: number;
  x: number;
  y: number;
  isBlindSpot: boolean;
  /** Målt tærskel (dB) */
  thresholdDb: number;
  /** Alderskorrigeret normativ tærskel (dB) */
  normativeDb: number;
  /** Total deviation (dB) = threshold - normative */
  totalDeviationDb: number;
  /** Pattern deviation (dB) = TD korrigeret for generel depression */
  patternDeviationDb: number;
  /** Probability klasse baseret på TD */
  totalDeviationProb: ProbabilityClass;
  /** Probability klasse baseret på PD */
  patternDeviationProb: ProbabilityClass;
  /** Er dette punkt del af en cluster? */
  inCluster: boolean;
  /** Cluster-ID (null hvis ikke i cluster) */
  clusterId: number | null;
}

// ─── Cluster ─────────────────────────────────────────────────

export interface Cluster {
  id: number;
  pointIds: number[];
  /** Gennemsnitlig deviation i clusteren */
  meanDeviationDb: number;
  /** Mest signifikante probability i clusteren */
  worstProbability: ProbabilityClass;
  /** Hemifelt (superior/inferior/both) */
  hemifield: "superior" | "inferior" | "both";
  /** Respekterer vertikal midtlinje? */
  respectsVerticalMeridian: boolean;
}

// ─── Mønster-analyse ─────────────────────────────────────────

export interface PatternAnalysis {
  /** Hemifield asymmetri detekteret */
  hemifieldAsymmetry: boolean;
  /** Øvre/nedre hemifelt mest påvirket */
  affectedHemifield: "superior" | "inferior" | "none" | "both";
  /** Hemifield difference (dB) */
  hemifieldDifferenceDb: number;
  /** Defekt respekterer vertikal midtlinje */
  respectsVerticalMeridian: boolean;
  /** Generaliseret depression (vs. fokal defekt) */
  generalizedDepression: boolean;
  /** Arkuat mønster (glaukom-typisk) */
  arcuatePattern: boolean;
  /** Nasal step (glaukom-typisk) */
  nasalStep: boolean;
  /** Detekterede mønstre */
  detectedPatterns: string[];
}

// ─── Samlet screening-resultat ───────────────────────────────

export type RiskLevel = "normal" | "mild_suspicion" | "clear_suspicion" | "refer";

export type RecommendedAction =
  | "routine_followup"    // Normal kontrol om 12-24 mdr
  | "repeat_test"         // Gentag test (dårlig kvalitet)
  | "extended_exam"       // Udvidet undersøgelse
  | "refer_glaucoma"      // Henvisning — glaukom
  | "refer_neuro"         // Henvisning — neurologi
  | "refer_urgent";       // Akut henvisning

export interface ScreeningResult {
  /** Reliability vurdering */
  reliability: ReliabilityAssessment;
  /** Analyserede punkter */
  points: AnalyzedPoint[];
  /** Detekterede clusters */
  clusters: Cluster[];
  /** Mønster-analyse */
  patterns: PatternAnalysis;
  /** Globale indices */
  globalIndices: {
    meanDeviationDb: number;
    patternStdDeviationDb: number;
    ghtResult: string;
  };
  /** Samlet risikoniveau */
  riskLevel: RiskLevel;
  /** Anbefalet handling */
  recommendedAction: RecommendedAction;
  /** Klinisk opsummering (maskingeneret tekst) */
  clinicalSummary: string;
  /** Disclaimer */
  disclaimer: string;
  /** Algoritme-version (audit trail) */
  algorithmVersion: string;
  /** Tidspunkt for analyse */
  analyzedAt: string;
}
