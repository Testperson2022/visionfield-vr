/**
 * Tests for Results Service — triage classification og quality metrics.
 */
import { classifyTriage, computeQualityMetrics, computeMeanDeviation } from "../src/services/results.service";

describe("classifyTriage", () => {
  it("should classify normal vision", () => {
    const result = classifyTriage(-1, 1.5);
    expect(result.classification).toBe("normal");
  });

  it("should classify borderline by MD", () => {
    const result = classifyTriage(-3, 1.5);
    expect(result.classification).toBe("borderline");
  });

  it("should classify borderline by PSD", () => {
    const result = classifyTriage(-1, 2.5);
    expect(result.classification).toBe("borderline");
  });

  it("should classify abnormal by MD", () => {
    const result = classifyTriage(-7, 1.5);
    expect(result.classification).toBe("abnormal");
  });

  it("should classify abnormal by PSD", () => {
    const result = classifyTriage(-1, 3.5);
    expect(result.classification).toBe("abnormal");
  });

  it("should handle boundary MD = -2 as normal", () => {
    const result = classifyTriage(-2, 1.9);
    expect(result.classification).toBe("normal");
  });

  it("should handle boundary MD = -6 as borderline", () => {
    const result = classifyTriage(-6, 1.5);
    expect(result.classification).toBe("borderline");
  });
});

describe("computeQualityMetrics", () => {
  it("should compute reliable when all rates low", () => {
    const result = computeQualityMetrics(10, 1, 10, 2, 100, 10, 240);
    expect(result.isReliable).toBe(true);
    expect(result.falsePositiveRate).toBe(0.1);
    expect(result.falseNegativeRate).toBe(0.2);
    expect(result.reliabilityIssues).toHaveLength(0);
  });

  it("should flag unreliable when FP too high", () => {
    const result = computeQualityMetrics(10, 3, 10, 1, 100, 5, 240);
    expect(result.isReliable).toBe(false);
    expect(result.reliabilityIssues.length).toBeGreaterThan(0);
  });

  it("should flag unreliable when FN too high", () => {
    const result = computeQualityMetrics(10, 1, 10, 4, 100, 5, 240);
    expect(result.isReliable).toBe(false);
  });

  it("should handle zero trials", () => {
    const result = computeQualityMetrics(0, 0, 0, 0, 0, 0, 240);
    expect(result.isReliable).toBe(true);
    expect(result.falsePositiveRate).toBe(0);
  });
});

describe("computeMeanDeviation", () => {
  it("should compute MD = 0 for normal vision", () => {
    const points = [
      { totalDeviationDb: 0 },
      { totalDeviationDb: 0 },
      { totalDeviationDb: 0 },
    ];
    expect(computeMeanDeviation(points)).toBe(0);
  });

  it("should compute negative MD for impaired vision", () => {
    const points = [
      { totalDeviationDb: -5 },
      { totalDeviationDb: -3 },
      { totalDeviationDb: -4 },
    ];
    expect(computeMeanDeviation(points)).toBe(-4);
  });

  it("should return 0 for empty array", () => {
    expect(computeMeanDeviation([])).toBe(0);
  });
});
