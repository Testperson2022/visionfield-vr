/**
 * Results Service — Beregn testresultater fra stimulus events.
 *
 * KLINISK KRITISK: Triage-klassifikation bestemmer patientens videre forløb.
 * Ref: shared/algorithms/zest.ts — classifyTriage()
 */
import { logger } from "../utils/logger";

/** Triage-grænser (spejler ClinicalConstants i Unity) */
const TRIAGE = {
  NORMAL_MD: -2,
  ABNORMAL_MD: -6,
  NORMAL_PSD: 2.0,
  ABNORMAL_PSD: 3.0,
  MAX_FP_RATE: 0.20,
  MAX_FN_RATE: 0.33,
  MAX_FIXATION_LOSS: 0.20,
} as const;

export interface PointResultData {
  gridPointId: number;
  thresholdDb: number;
  posteriorSdDb: number;
  totalDeviationDb: number;
  patternDeviationDb: number;
  numStimuli: number;
}

export interface TestResultsData {
  pointResults: PointResultData[];
  meanDeviationDb: number;
  patternSdDb: number;
  triageClassification: "normal" | "borderline" | "abnormal";
  triageRecommendation: string;
}

export interface QualityMetricsData {
  falsePositiveRate: number;
  falseNegativeRate: number;
  fixationLossRate: number;
  testDurationSeconds: number;
  isReliable: boolean;
  reliabilityIssues: string[];
}

/**
 * Klassificér testresultat til triagekategori.
 * Spejler classifyTriage() i shared/algorithms/zest.ts.
 */
export function classifyTriage(
  mdDb: number,
  psdDb: number
): { classification: "normal" | "borderline" | "abnormal"; recommendation: string } {
  if (mdDb < TRIAGE.ABNORMAL_MD || psdDb > TRIAGE.ABNORMAL_PSD) {
    return {
      classification: "abnormal",
      recommendation:
        "Unormalt synsfelt. Anbefal: Henvisning til øjenlæge inden for 4 uger.",
    };
  }
  if (mdDb < TRIAGE.NORMAL_MD || psdDb > TRIAGE.NORMAL_PSD) {
    return {
      classification: "borderline",
      recommendation:
        "Grænseværdi synsfelt. Anbefal: Fuld Humphrey-test hos øjenlæge inden for 3 måneder.",
    };
  }
  return {
    classification: "normal",
    recommendation:
      "Normalt synsfelt. Genscreening anbefalet om 12-24 måneder, eller ved symptomer.",
  };
}

/** Beregn kvalitetsmetrics fra catch trial data. */
export function computeQualityMetrics(
  fpTrials: number,
  fpResponses: number,
  fnTrials: number,
  fnResponses: number,
  fixationChecks: number,
  fixationLosses: number,
  durationSeconds: number
): QualityMetricsData {
  const fpRate = fpTrials > 0 ? fpResponses / fpTrials : 0;
  const fnRate = fnTrials > 0 ? fnResponses / fnTrials : 0;
  const fixLossRate = fixationChecks > 0 ? fixationLosses / fixationChecks : 0;

  const issues: string[] = [];
  if (fpRate >= TRIAGE.MAX_FP_RATE)
    issues.push(`False positive rate (${(fpRate * 100).toFixed(0)}%) over grænse`);
  if (fnRate >= TRIAGE.MAX_FN_RATE)
    issues.push(`False negative rate (${(fnRate * 100).toFixed(0)}%) over grænse`);
  if (fixLossRate >= TRIAGE.MAX_FIXATION_LOSS)
    issues.push(`Fixation loss rate (${(fixLossRate * 100).toFixed(0)}%) over grænse`);

  return {
    falsePositiveRate: fpRate,
    falseNegativeRate: fnRate,
    fixationLossRate: fixLossRate,
    testDurationSeconds: durationSeconds,
    isReliable: fpRate < TRIAGE.MAX_FP_RATE && fnRate < TRIAGE.MAX_FN_RATE,
    reliabilityIssues: issues,
  };
}

/** Beregn Mean Deviation (MD). */
export function computeMeanDeviation(
  pointResults: Array<{ totalDeviationDb: number }>
): number {
  if (pointResults.length === 0) return 0;
  const sum = pointResults.reduce((acc, p) => acc + p.totalDeviationDb, 0);
  return sum / pointResults.length;
}
