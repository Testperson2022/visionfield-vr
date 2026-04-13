/**
 * VisionField VR — Screening Engine
 *
 * Modulær screeningsmotor med separate funktioner for:
 * 1. validateReliability()     — testkvalitet
 * 2. classifyPoints()          — per-punkt probability
 * 3. detectClusters()          — sammenhængende defekter
 * 4. analyzePatterns()         — mønstergenkendelse
 * 5. assessRisk()              — samlet risikoniveau
 * 6. generateClinicalSummary() — maskingeneret tekst
 *
 * VIGTIGT: Dette er et screeningsværktøj.
 * Resultater skal altid vurderes af kvalificeret fagperson.
 */

import { ScreeningConfig, DEFAULT_SCREENING_CONFIG } from "./config";
import {
  ReliabilityAssessment, ReliabilityGrade, AnalyzedPoint,
  ProbabilityClass, Cluster, PatternAnalysis, RiskLevel,
  RecommendedAction, ScreeningResult
} from "./types";

const ALGORITHM_VERSION = "1.0.0-screening";

const DISCLAIMER =
  "SCREENING — IKKE DIAGNOSTISK. " +
  "Dette resultat er et screenings- og beslutningsstøtteværktøj. " +
  "Resultatet erstatter ikke en fuld klinisk undersøgelse og skal " +
  "altid vurderes af en kvalificeret fagperson. " +
  "Ved mistanke om synsfeltdefekt anbefales henvisning til øjenlæge.";

// ─── 1. RELIABILITY ──────────────────────────────────────────

export function validateReliability(
  fpRate: number,
  fnRate: number,
  fixLossRate: number,
  completionRate: number,
  medianResponseTimeMs: number | null,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): ReliabilityAssessment {
  const c = config.reliability;
  const issues: string[] = [];
  let grade: ReliabilityGrade = "good";

  // False positives
  if (fpRate >= c.fpRateCaution) {
    grade = "unreliable";
    issues.push(`False positive rate (${(fpRate * 100).toFixed(0)}%) over grænse (${(c.fpRateCaution * 100).toFixed(0)}%)`);
  } else if (fpRate >= c.fpRateGood) {
    if (grade === "good") grade = "caution";
    issues.push(`False positive rate (${(fpRate * 100).toFixed(0)}%) let forhøjet`);
  }

  // False negatives
  if (fnRate >= c.fnRateCaution) {
    grade = "unreliable";
    issues.push(`False negative rate (${(fnRate * 100).toFixed(0)}%) over grænse`);
  } else if (fnRate >= c.fnRateGood) {
    if (grade === "good") grade = "caution";
    issues.push(`False negative rate (${(fnRate * 100).toFixed(0)}%) let forhøjet`);
  }

  // Fixation loss
  if (fixLossRate >= c.fixLossCaution) {
    grade = "unreliable";
    issues.push(`Fixation loss (${(fixLossRate * 100).toFixed(0)}%) ustabil fiksation`);
  } else if (fixLossRate >= c.fixLossGood) {
    if (grade === "good") grade = "caution";
    issues.push(`Fixation loss (${(fixLossRate * 100).toFixed(0)}%) let forhøjet`);
  }

  // Completion
  if (completionRate < c.minCompletionRate) {
    if (grade !== "unreliable") grade = "caution";
    issues.push(`Kun ${(completionRate * 100).toFixed(0)}% af punkter konvergeret`);
  }

  // Response time
  if (medianResponseTimeMs !== null && medianResponseTimeMs > c.maxMedianResponseTimeMs) {
    if (grade === "good") grade = "caution";
    issues.push(`Median reaktionstid (${medianResponseTimeMs.toFixed(0)} ms) forhøjet`);
  }

  return {
    grade,
    falsePositiveRate: fpRate,
    falseNegativeRate: fnRate,
    fixationLossRate: fixLossRate,
    completionRate,
    medianResponseTimeMs,
    issues,
    canInterpret: grade !== "unreliable",
  };
}

// ─── 2. POINT CLASSIFICATION ─────────────────────────────────

export function classifyDeviation(
  deviationDb: number,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): ProbabilityClass {
  const d = config.deviation;
  if (deviationDb <= d.p05threshold) return "p05";
  if (deviationDb <= d.p1threshold) return "p1";
  if (deviationDb <= d.p2threshold) return "p2";
  if (deviationDb <= d.p5threshold) return "p5";
  return "normal";
}

export function classifyPoints(
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
    pattern_deviation_db?: number;
    x_deg: number;
    y_deg: number;
    is_blind_spot?: boolean;
    normative_db?: number;
  }>,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): AnalyzedPoint[] {
  // Beregn 7. percentil korrektion for pattern deviation
  const tdValues = pointResults
    .filter(p => !p.is_blind_spot)
    .map(p => p.total_deviation_db)
    .sort((a, b) => b - a); // Højeste først
  const pdCorrection = tdValues.length > 6 ? tdValues[6] : (tdValues.length > 0 ? tdValues[0] : 0);

  return pointResults.map(p => {
    const pd = p.pattern_deviation_db ?? (p.total_deviation_db - pdCorrection);
    return {
      gridPointId: p.grid_point_id,
      x: p.x_deg,
      y: p.y_deg,
      isBlindSpot: p.is_blind_spot ?? false,
      thresholdDb: p.threshold_db,
      normativeDb: p.normative_db ?? (p.threshold_db - p.total_deviation_db),
      totalDeviationDb: p.total_deviation_db,
      patternDeviationDb: pd,
      totalDeviationProb: classifyDeviation(p.total_deviation_db, config),
      patternDeviationProb: classifyDeviation(pd, config),
      inCluster: false,
      clusterId: null,
    };
  });
}

// ─── 3. CLUSTER DETECTION ────────────────────────────────────

/** Definer naboer for 24-2 grid (6° spacing) */
function getNeighbors(
  point: AnalyzedPoint,
  allPoints: AnalyzedPoint[],
  includeDiagonal: boolean
): AnalyzedPoint[] {
  const maxDist = includeDiagonal ? 9 : 7; // 6° ortogonal, ~8.5° diagonal
  return allPoints.filter(p =>
    p.gridPointId !== point.gridPointId &&
    !p.isBlindSpot &&
    Math.sqrt((p.x - point.x) ** 2 + (p.y - point.y) ** 2) <= maxDist
  );
}

function probLevelNum(prob: ProbabilityClass): number {
  switch (prob) {
    case "p05": return 4;
    case "p1": return 3;
    case "p2": return 2;
    case "p5": return 1;
    default: return 0;
  }
}

export function detectClusters(
  points: AnalyzedPoint[],
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): Cluster[] {
  const c = config.cluster;
  const significantPoints = points.filter(
    p => !p.isBlindSpot && probLevelNum(p.patternDeviationProb) >= c.minClusterProbLevel
  );

  // Flood-fill clustering
  const visited = new Set<number>();
  const clusters: Cluster[] = [];
  let clusterId = 0;

  for (const startPoint of significantPoints) {
    if (visited.has(startPoint.gridPointId)) continue;

    // BFS fra dette punkt
    const queue = [startPoint];
    const clusterPoints: AnalyzedPoint[] = [];
    visited.add(startPoint.gridPointId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      clusterPoints.push(current);

      const neighbors = getNeighbors(current, significantPoints, c.includeDiagonalNeighbors);
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.gridPointId)) {
          visited.add(neighbor.gridPointId);
          queue.push(neighbor);
        }
      }
    }

    // Kun clusters med nok punkter
    if (clusterPoints.length >= c.minClusterSize) {
      const meanDev = clusterPoints.reduce((s, p) => s + p.patternDeviationDb, 0) / clusterPoints.length;
      const worstProb = clusterPoints.reduce(
        (worst, p) => probLevelNum(p.patternDeviationProb) > probLevelNum(worst) ? p.patternDeviationProb : worst,
        "normal" as ProbabilityClass
      );

      const superior = clusterPoints.filter(p => p.y > 0).length;
      const inferior = clusterPoints.filter(p => p.y < 0).length;
      const hemifield: "superior" | "inferior" | "both" =
        superior > 0 && inferior > 0 ? "both" :
        superior > 0 ? "superior" : "inferior";

      // Check vertikal meridian respect
      const leftSide = clusterPoints.filter(p => p.x < 0).length;
      const rightSide = clusterPoints.filter(p => p.x > 0).length;
      const respectsVertical = leftSide === 0 || rightSide === 0 ||
        (Math.min(leftSide, rightSide) / Math.max(leftSide, rightSide)) < 0.2;

      // Markér punkter som del af cluster
      clusterPoints.forEach(p => {
        p.inCluster = true;
        p.clusterId = clusterId;
      });

      clusters.push({
        id: clusterId,
        pointIds: clusterPoints.map(p => p.gridPointId),
        meanDeviationDb: meanDev,
        worstProbability: worstProb,
        hemifield,
        respectsVerticalMeridian: respectsVertical,
      });

      clusterId++;
    }
  }

  return clusters;
}

// ─── 4. PATTERN ANALYSIS ─────────────────────────────────────

export function analyzePatterns(
  points: AnalyzedPoint[],
  clusters: Cluster[],
  md: number,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): PatternAnalysis {
  const c = config.pattern;
  const nonBlind = points.filter(p => !p.isBlindSpot);

  // Hemifield asymmetri
  const superiorPoints = nonBlind.filter(p => p.y > 0);
  const inferiorPoints = nonBlind.filter(p => p.y < 0);
  const superiorMeanTD = superiorPoints.reduce((s, p) => s + p.totalDeviationDb, 0) / superiorPoints.length;
  const inferiorMeanTD = inferiorPoints.reduce((s, p) => s + p.totalDeviationDb, 0) / inferiorPoints.length;
  const hemifieldDiff = Math.abs(superiorMeanTD - inferiorMeanTD);
  const hemifieldAsymmetry = hemifieldDiff > c.hemifieldNormalDiffDb;

  const affectedHemifield: "superior" | "inferior" | "none" | "both" =
    !hemifieldAsymmetry ? "none" :
    superiorMeanTD < inferiorMeanTD ? "superior" : "inferior";

  // Vertikal meridian respect
  const significantNearVertical = nonBlind.filter(p =>
    Math.abs(p.x) <= c.verticalRespectMaxDegrees &&
    probLevelNum(p.patternDeviationProb) >= 1
  );
  const leftOfVertical = significantNearVertical.filter(p => p.x < 0).length;
  const rightOfVertical = significantNearVertical.filter(p => p.x > 0).length;
  const respectsVerticalMeridian =
    significantNearVertical.length >= c.verticalRespectMinPoints &&
    (leftOfVertical === 0 || rightOfVertical === 0);

  // Generaliseret depression
  const generalizedDepression = md < c.generalDepressionMdDb &&
    nonBlind.filter(p => p.totalDeviationProb !== "normal").length / nonBlind.length > 0.6;

  // Arkuat mønster (glaukom-typisk: defekter i arcuate zone, y=10-25°)
  const arcuateZone = nonBlind.filter(p =>
    Math.abs(p.y) >= 10 && Math.abs(p.y) <= 25 &&
    probLevelNum(p.patternDeviationProb) >= 2
  );
  const arcuatePattern = arcuateZone.length >= 3;

  // Nasal step (glaukom-typisk: asymmetri over horisontal meridian nasalt)
  const nasalSuperior = nonBlind.filter(p => p.x < -10 && p.y > 0 && probLevelNum(p.patternDeviationProb) >= 1);
  const nasalInferior = nonBlind.filter(p => p.x < -10 && p.y < 0 && probLevelNum(p.patternDeviationProb) >= 1);
  const nasalStep = Math.abs(nasalSuperior.length - nasalInferior.length) >= 2;

  // Detekterede mønstre
  const detectedPatterns: string[] = [];
  if (hemifieldAsymmetry) detectedPatterns.push("Hemifield asymmetri");
  if (respectsVerticalMeridian) detectedPatterns.push("Respekterer vertikal midtlinje");
  if (generalizedDepression) detectedPatterns.push("Generaliseret depression");
  if (arcuatePattern) detectedPatterns.push("Arkuat defekt");
  if (nasalStep) detectedPatterns.push("Nasal step");
  if (clusters.length > 0) detectedPatterns.push(`${clusters.length} cluster(s) detekteret`);

  return {
    hemifieldAsymmetry,
    affectedHemifield,
    hemifieldDifferenceDb: hemifieldDiff,
    respectsVerticalMeridian,
    generalizedDepression,
    arcuatePattern,
    nasalStep,
    detectedPatterns,
  };
}

// ─── 5. RISK ASSESSMENT ──────────────────────────────────────

export function assessRisk(
  reliability: ReliabilityAssessment,
  md: number,
  psd: number,
  clusters: Cluster[],
  patterns: PatternAnalysis,
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): { riskLevel: RiskLevel; recommendedAction: RecommendedAction } {
  const r = config.risk;

  // Upålidelig test → gentag
  if (!reliability.canInterpret) {
    return { riskLevel: "mild_suspicion", recommendedAction: "repeat_test" };
  }

  // Neurologisk mistanke (vertikal meridian)
  if (patterns.respectsVerticalMeridian && clusters.length >= 1) {
    return { riskLevel: "refer", recommendedAction: "refer_neuro" };
  }

  // Tydelig mistanke
  if (
    md < r.clearSuspicionMdDb ||
    psd > r.clearSuspicionPsdDb ||
    clusters.length >= r.clearSuspicionMinClusters ||
    (patterns.arcuatePattern && patterns.hemifieldAsymmetry)
  ) {
    return { riskLevel: "refer", recommendedAction: "refer_glaucoma" };
  }

  // Let mistanke
  if (
    md < r.mildSuspicionMdDb ||
    psd > r.mildSuspicionPsdDb ||
    clusters.length >= 1 ||
    patterns.hemifieldAsymmetry
  ) {
    return { riskLevel: "clear_suspicion", recommendedAction: "extended_exam" };
  }

  // Caution reliability → udvidet
  if (reliability.grade === "caution") {
    return { riskLevel: "mild_suspicion", recommendedAction: "repeat_test" };
  }

  return { riskLevel: "normal", recommendedAction: "routine_followup" };
}

// ─── 6. CLINICAL SUMMARY ─────────────────────────────────────

export function generateClinicalSummary(
  reliability: ReliabilityAssessment,
  md: number,
  psd: number,
  clusters: Cluster[],
  patterns: PatternAnalysis,
  riskLevel: RiskLevel,
  action: RecommendedAction
): string {
  const parts: string[] = [];

  // Reliability
  switch (reliability.grade) {
    case "good": parts.push("Testen er pålidelig."); break;
    case "caution": parts.push("Testkvaliteten er nedsat — resultat bør tolkes med forsigtighed."); break;
    case "unreliable": parts.push("Testen er upålidelig og bør gentages."); break;
  }

  // Globale indices
  parts.push(`MD ${md.toFixed(1)} dB, PSD ${psd.toFixed(1)} dB.`);

  // Mønstre
  if (patterns.detectedPatterns.length > 0) {
    parts.push(patterns.detectedPatterns.join(". ") + ".");
  } else if (riskLevel === "normal") {
    parts.push("Ingen signifikante defekter detekteret.");
  }

  // Clusters
  if (clusters.length > 0) {
    const locations = clusters.map(c =>
      c.hemifield === "superior" ? "superiort" :
      c.hemifield === "inferior" ? "inferiort" : "begge hemifelter"
    );
    parts.push(`Lokale defekter ${[...new Set(locations)].join(" og ")}.`);
  }

  // Mønster-tolkning
  if (patterns.arcuatePattern || patterns.nasalStep) {
    parts.push("Mønster foreneligt med glaukommistanke.");
  }
  if (patterns.respectsVerticalMeridian) {
    parts.push("Defekt respekterer vertikal midtlinje — neurologisk vurdering bør overvejes.");
  }
  if (patterns.generalizedDepression && !patterns.hemifieldAsymmetry) {
    parts.push("Generaliseret depression uden lokale defekter — overvej mediegrumshed eller refraktionsfejl.");
  }

  // Anbefaling
  switch (action) {
    case "routine_followup": parts.push("Anbefaling: Rutinekontrol om 12-24 måneder."); break;
    case "repeat_test": parts.push("Anbefaling: Gentag test under bedre betingelser."); break;
    case "extended_exam": parts.push("Anbefaling: Udvidet undersøgelse med fuld perimetri."); break;
    case "refer_glaucoma": parts.push("Anbefaling: Henvisning til øjenlæge inden 4 uger (glaukommistanke)."); break;
    case "refer_neuro": parts.push("Anbefaling: Neurologisk vurdering anbefales."); break;
    case "refer_urgent": parts.push("Anbefaling: AKUT henvisning."); break;
  }

  return parts.join(" ");
}

// ─── HOVEDFUNKTION ───────────────────────────────────────────

export function runScreeningAnalysis(
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
    pattern_deviation_db?: number;
    x_deg: number;
    y_deg: number;
    is_blind_spot?: boolean;
    normative_db?: number;
  }>,
  qualityMetrics: {
    fpRate: number;
    fnRate: number;
    fixLossRate: number;
    completionRate: number;
    medianResponseTimeMs?: number;
  },
  config: ScreeningConfig = DEFAULT_SCREENING_CONFIG
): ScreeningResult {
  // 1. Reliability
  const reliability = validateReliability(
    qualityMetrics.fpRate,
    qualityMetrics.fnRate,
    qualityMetrics.fixLossRate,
    qualityMetrics.completionRate,
    qualityMetrics.medianResponseTimeMs ?? null,
    config
  );

  // 2. Classify points
  const points = classifyPoints(pointResults, config);

  // 3. Detect clusters
  const clusters = detectClusters(points, config);

  // 4. Global indices
  const nonBlind = points.filter(p => !p.isBlindSpot);
  const md = nonBlind.reduce((s, p) => s + p.totalDeviationDb, 0) / nonBlind.length;
  const pdValues = nonBlind.map(p => p.patternDeviationDb);
  const psd = Math.sqrt(pdValues.reduce((s, v) => s + v * v, 0) / pdValues.length);

  // 5. Pattern analysis
  const patterns = analyzePatterns(points, clusters, md, config);

  // 6. Risk assessment
  const { riskLevel, recommendedAction } = assessRisk(reliability, md, psd, clusters, patterns, config);

  // 7. Clinical summary
  const clinicalSummary = generateClinicalSummary(reliability, md, psd, clusters, patterns, riskLevel, recommendedAction);

  return {
    reliability,
    points,
    clusters,
    patterns,
    globalIndices: { meanDeviationDb: md, patternStdDeviationDb: psd, ghtResult: "" },
    riskLevel,
    recommendedAction,
    clinicalSummary,
    disclaimer: DISCLAIMER,
    algorithmVersion: ALGORITHM_VERSION,
    analyzedAt: new Date().toISOString(),
  };
}
