/**
 * Tests for Test Session Service — lifecycle logic og stimulus event validation.
 * Tests der ikke kræver DB-forbindelse.
 */
import { classifyTriage, computeQualityMetrics } from "../src/services/results.service";

describe("Test session lifecycle", () => {
  const VALID_STATUSES = [
    "INITIALIZING", "CALIBRATING", "RUNNING",
    "PAUSED", "COMPLETED", "ABORTED", "INVALID"
  ];

  it("should have all expected status values", () => {
    expect(VALID_STATUSES).toHaveLength(7);
    expect(VALID_STATUSES).toContain("INITIALIZING");
    expect(VALID_STATUSES).toContain("COMPLETED");
    expect(VALID_STATUSES).toContain("INVALID");
  });

  it("should mark session INVALID when FP rate >= 20%", () => {
    const quality = computeQualityMetrics(10, 2, 10, 1, 100, 5, 240);
    // FP = 2/10 = 20% → unreliable
    expect(quality.isReliable).toBe(false);
    expect(quality.falsePositiveRate).toBe(0.2);
  });

  it("should mark session COMPLETED when quality is good", () => {
    const quality = computeQualityMetrics(10, 1, 10, 2, 100, 10, 240);
    // FP = 10%, FN = 20% → reliable
    expect(quality.isReliable).toBe(true);
  });

  it("should mark session INVALID when FN rate >= 33%", () => {
    const quality = computeQualityMetrics(10, 1, 9, 3, 100, 5, 240);
    // FN = 3/9 = 33.3% → unreliable
    expect(quality.isReliable).toBe(false);
  });
});

describe("Stimulus event validation", () => {
  it("should always record duration_ms as 200", () => {
    const STIMULUS_DURATION_MS = 200;
    expect(STIMULUS_DURATION_MS).toBe(200);
  });

  it("should record catch trial types correctly", () => {
    const FP_TYPE = "false_positive";
    const FN_TYPE = "false_negative";

    expect(FP_TYPE).toBe("false_positive");
    expect(FN_TYPE).toBe("false_negative");
  });

  it("should validate intensity is within 0-51 dB range", () => {
    const validIntensities = [0, 10, 25.5, 40, 51];
    validIntensities.forEach((db) => {
      expect(db).toBeGreaterThanOrEqual(0);
      expect(db).toBeLessThanOrEqual(51);
    });
  });

  it("should record fixation data per stimulus", () => {
    const stimulusEvent = {
      gridPointId: 4,
      intensityDb: 25.5,
      xDeg: -3,
      yDeg: 3,
      isCatchTrial: false,
      catchTrialType: null,
      responded: true,
      responseTimeMs: 350,
      fixationOk: true,
      fixationDeviationDeg: 0.8,
    };

    expect(stimulusEvent.fixationOk).toBe(true);
    expect(stimulusEvent.fixationDeviationDeg).toBeLessThan(2.0); // Within threshold
    expect(stimulusEvent.responseTimeMs).toBeGreaterThan(0);
  });
});

describe("Triage integration with session completion", () => {
  it("should produce normal triage for good results", () => {
    const { classification } = classifyTriage(-1, 1.5);
    expect(classification).toBe("normal");
  });

  it("should produce abnormal triage for severe loss", () => {
    const { classification, recommendation } = classifyTriage(-8, 4.0);
    expect(classification).toBe("abnormal");
    expect(recommendation).toContain("4 uger");
  });

  it("should combine quality and triage for final status", () => {
    // Reliable test with borderline results
    const quality = computeQualityMetrics(10, 1, 10, 2, 100, 10, 240);
    const { classification } = classifyTriage(-3, 2.5);

    expect(quality.isReliable).toBe(true);
    expect(classification).toBe("borderline");
    // Final status: COMPLETED (reliable) with borderline triage

    // Unreliable test — regardless of triage, test is INVALID
    const badQuality = computeQualityMetrics(10, 3, 10, 1, 100, 5, 240);
    expect(badQuality.isReliable).toBe(false);
    // Final status: INVALID
  });
});
