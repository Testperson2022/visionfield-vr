/**
 * Tests for Screening Engine
 */
import { validateReliability, classifyDeviation, detectClusters, classifyPoints, assessRisk, analyzePatterns, generateClinicalSummary } from "./engine";
import { DEFAULT_SCREENING_CONFIG } from "./config";

describe("validateReliability", () => {
  it("good when all metrics are low", () => {
    const r = validateReliability(0.05, 0.10, 0.08, 0.95, 400);
    expect(r.grade).toBe("good");
    expect(r.canInterpret).toBe(true);
    expect(r.issues).toHaveLength(0);
  });

  it("caution when FP is borderline", () => {
    const r = validateReliability(0.20, 0.10, 0.08, 0.95, 400);
    expect(r.grade).toBe("caution");
    expect(r.canInterpret).toBe(true);
  });

  it("unreliable when FP is high", () => {
    const r = validateReliability(0.40, 0.10, 0.08, 0.95, 400);
    expect(r.grade).toBe("unreliable");
    expect(r.canInterpret).toBe(false);
  });

  it("unreliable when FN is high", () => {
    const r = validateReliability(0.05, 0.40, 0.08, 0.95, 400);
    expect(r.grade).toBe("unreliable");
  });

  it("caution when completion is low", () => {
    const r = validateReliability(0.05, 0.10, 0.08, 0.70, 400);
    expect(r.grade).toBe("caution");
  });

  it("caution when response time is high", () => {
    const r = validateReliability(0.05, 0.10, 0.08, 0.95, 1200);
    expect(r.grade).toBe("caution");
  });
});

describe("classifyDeviation", () => {
  it("normal for small deviation", () => {
    expect(classifyDeviation(-1)).toBe("normal");
    expect(classifyDeviation(0)).toBe("normal");
    expect(classifyDeviation(2)).toBe("normal");
  });

  it("p5 for moderate deviation", () => {
    expect(classifyDeviation(-4)).toBe("p5");
  });

  it("p2 for significant deviation", () => {
    expect(classifyDeviation(-6)).toBe("p2");
  });

  it("p1 for severe deviation", () => {
    expect(classifyDeviation(-8)).toBe("p1");
  });

  it("p05 for profound deviation", () => {
    expect(classifyDeviation(-12)).toBe("p05");
  });
});

describe("detectClusters", () => {
  it("no clusters when all normal", () => {
    const points = classifyPoints([
      { grid_point_id: 0, threshold_db: 30, total_deviation_db: 0, x_deg: -27, y_deg: 3 },
      { grid_point_id: 1, threshold_db: 28, total_deviation_db: -1, x_deg: -21, y_deg: 3 },
      { grid_point_id: 2, threshold_db: 29, total_deviation_db: 0, x_deg: -15, y_deg: 3 },
    ]);
    const clusters = detectClusters(points);
    expect(clusters).toHaveLength(0);
  });

  it("detects cluster of adjacent defects", () => {
    const points = classifyPoints([
      { grid_point_id: 0, threshold_db: 10, total_deviation_db: -15, x_deg: -27, y_deg: 3 },
      { grid_point_id: 1, threshold_db: 12, total_deviation_db: -14, x_deg: -21, y_deg: 3 },
      { grid_point_id: 2, threshold_db: 11, total_deviation_db: -16, x_deg: -15, y_deg: 3 },
      { grid_point_id: 3, threshold_db: 28, total_deviation_db: 0, x_deg: -9, y_deg: 3 },
    ]);
    const clusters = detectClusters(points);
    expect(clusters.length).toBeGreaterThanOrEqual(1);
    expect(clusters[0].pointIds).toContain(0);
    expect(clusters[0].pointIds).toContain(1);
    expect(clusters[0].pointIds).toContain(2);
  });
});

describe("assessRisk", () => {
  const goodReliability = validateReliability(0.05, 0.10, 0.08, 0.95, 400);
  const noPatterns = {
    hemifieldAsymmetry: false, affectedHemifield: "none" as const,
    hemifieldDifferenceDb: 1, respectsVerticalMeridian: false,
    generalizedDepression: false, arcuatePattern: false,
    nasalStep: false, detectedPatterns: [],
  };

  it("normal for good test with normal results", () => {
    const { riskLevel } = assessRisk(goodReliability, -0.5, 1.2, [], noPatterns);
    expect(riskLevel).toBe("normal");
  });

  it("refer for high MD", () => {
    const { riskLevel, recommendedAction } = assessRisk(goodReliability, -7, 1.5, [], noPatterns);
    expect(riskLevel).toBe("refer");
    expect(recommendedAction).toBe("refer_glaucoma");
  });

  it("refer_neuro for vertical meridian respect", () => {
    const neuroPattern = { ...noPatterns, respectsVerticalMeridian: true };
    const fakeCluster = [{ id: 0, pointIds: [1, 2, 3], meanDeviationDb: -10, worstProbability: "p1" as const, hemifield: "superior" as const, respectsVerticalMeridian: true }];
    const { recommendedAction } = assessRisk(goodReliability, -3, 2.5, fakeCluster, neuroPattern);
    expect(recommendedAction).toBe("refer_neuro");
  });

  it("repeat_test for unreliable", () => {
    const badReliability = validateReliability(0.40, 0.10, 0.08, 0.95, 400);
    const { recommendedAction } = assessRisk(badReliability, -1, 1.5, [], noPatterns);
    expect(recommendedAction).toBe("repeat_test");
  });
});

describe("generateClinicalSummary", () => {
  it("includes reliability and recommendation", () => {
    const reliability = validateReliability(0.05, 0.10, 0.08, 0.95, 400);
    const noPatterns = {
      hemifieldAsymmetry: false, affectedHemifield: "none" as const,
      hemifieldDifferenceDb: 1, respectsVerticalMeridian: false,
      generalizedDepression: false, arcuatePattern: false,
      nasalStep: false, detectedPatterns: [],
    };
    const summary = generateClinicalSummary(reliability, -0.5, 1.2, [], noPatterns, "normal", "routine_followup");
    expect(summary).toContain("pålidelig");
    expect(summary).toContain("Rutinekontrol");
  });

  it("mentions glaucoma pattern", () => {
    const reliability = validateReliability(0.05, 0.10, 0.08, 0.95, 400);
    const glaucomaPattern = {
      hemifieldAsymmetry: true, affectedHemifield: "superior" as const,
      hemifieldDifferenceDb: 5, respectsVerticalMeridian: false,
      generalizedDepression: false, arcuatePattern: true,
      nasalStep: true, detectedPatterns: ["Arkuat defekt", "Nasal step", "Hemifield asymmetri"],
    };
    const summary = generateClinicalSummary(reliability, -5, 4.0, [], glaucomaPattern, "refer", "refer_glaucoma");
    expect(summary).toContain("glaukom");
  });
});
