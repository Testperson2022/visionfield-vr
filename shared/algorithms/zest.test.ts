/**
 * VisionField VR — ZEST Algoritme Tests
 *
 * Disse tests verificerer den kliniske korrekthed af ZEST-algoritmen.
 * Alle tests SKAL bestå før deployment til klinisk brug.
 */

import { ZestPoint, DEFAULT_ZEST_CONFIG, classifyTriage, computeMeanDeviation } from "../algorithms/zest";
import { GRID_24_2 } from "../types/testGrid";

describe("ZestPoint — Grundlæggende funktionalitet", () => {
  const centralPoint = GRID_24_2.find((p) => p.id === 31)!; // (-3°, 21°) central punkt

  test("Initialiseres med normativ tærskel som startestimering", () => {
    const zest = new ZestPoint(centralPoint);
    const initialDb = zest.getNextStimulusDb();
    expect(Math.abs(initialDb - centralPoint.normative_threshold_db)).toBeLessThan(2.0);
  });

  test("Konvergerer ved simuleret normalt synsfelt", () => {
    const zest = new ZestPoint(centralPoint);
    const trueThreshold = 31.0; // Normal tærskel

    let iterations = 0;
    while (!zest.isConverged() && iterations < 100) {
      const stimulus = zest.getNextStimulusDb();
      // Simuler: patient ser stimuli over tærskel
      const seen = stimulus <= trueThreshold;
      zest.updateWithResponse(stimulus, seen);
      iterations++;
    }

    expect(zest.isConverged()).toBe(true);
    const result = zest.getResult(centralPoint.normative_threshold_db);
    expect(Math.abs(result.threshold_db - trueThreshold)).toBeLessThan(3.0);
    expect(result.posterior_sd_db).toBeLessThan(DEFAULT_ZEST_CONFIG.stop_sd_db);
  });

  test("Detekterer absolut skotom (threshold = 0 dB)", () => {
    const zest = new ZestPoint(centralPoint);

    let iterations = 0;
    while (!zest.isConverged() && iterations < 100) {
      const stimulus = zest.getNextStimulusDb();
      // Simuler: patient ser aldrig noget (absolut skotom)
      zest.updateWithResponse(stimulus, false);
      iterations++;
    }

    expect(zest.isConverged()).toBe(true);
    const result = zest.getResult(centralPoint.normative_threshold_db);
    expect(result.threshold_db).toBeLessThan(5.0); // Tærskel tæt på 0
  });

  test("Stopper senest ved max_stimuli", () => {
    const config = { ...DEFAULT_ZEST_CONFIG, max_stimuli: 10 };
    const zest = new ZestPoint(centralPoint, config);

    let iterations = 0;
    while (!zest.isConverged()) {
      zest.updateWithResponse(zest.getNextStimulusDb(), true);
      iterations++;
      if (iterations > 20) break; // Sikkerhedsventil
    }

    expect(iterations).toBeLessThanOrEqual(10);
  });

  test("Kaster fejl hvis getNextStimulusDb kaldes efter konvergens", () => {
    const config = { ...DEFAULT_ZEST_CONFIG, max_stimuli: 1 };
    const zest = new ZestPoint(centralPoint, config);
    zest.updateWithResponse(30, true); // Tvunget konvergens

    expect(() => zest.getNextStimulusDb()).toThrow();
  });
});

describe("ZEST — Stimulus range", () => {
  test("Foreslår altid stimulus inden for gyldigt dB-interval", () => {
    const zest = new ZestPoint(GRID_24_2[0]);
    for (let i = 0; i < 20; i++) {
      if (zest.isConverged()) break;
      const stimulus = zest.getNextStimulusDb();
      expect(stimulus).toBeGreaterThanOrEqual(DEFAULT_ZEST_CONFIG.db_min);
      expect(stimulus).toBeLessThanOrEqual(DEFAULT_ZEST_CONFIG.db_max);
      zest.updateWithResponse(stimulus, Math.random() > 0.5);
    }
  });
});

describe("Triage-klassifikation", () => {
  test("Normal: MD > -2, PSD < 2.0", () => {
    const result = classifyTriage(-1.0, 1.5);
    expect(result.classification).toBe("normal");
  });

  test("Borderline: MD mellem -2 og -6", () => {
    const result = classifyTriage(-4.0, 1.8);
    expect(result.classification).toBe("borderline");
  });

  test("Borderline: PSD > 2.0 men MD normal", () => {
    const result = classifyTriage(-1.0, 2.5);
    expect(result.classification).toBe("borderline");
  });

  test("Unormal: MD < -6", () => {
    const result = classifyTriage(-8.0, 2.5);
    expect(result.classification).toBe("abnormal");
  });

  test("Unormal: PSD > 3.0", () => {
    const result = classifyTriage(-1.0, 3.5);
    expect(result.classification).toBe("abnormal");
  });

  test("Grænsetilfælde: MD præcis -2.0 → borderline", () => {
    const result = classifyTriage(-2.0, 1.5);
    expect(result.classification).toBe("borderline");
  });

  test("Grænsetilfælde: MD præcis -6.0 → abnormal", () => {
    const result = classifyTriage(-6.0, 1.5);
    expect(result.classification).toBe("abnormal");
  });

  test("Alle klassifikationer har en recommendation-tekst", () => {
    ["normal", "borderline", "abnormal"].forEach((cls) => {
      const md = cls === "normal" ? -1 : cls === "borderline" ? -4 : -8;
      const result = classifyTriage(md, 1.5);
      expect(result.recommendation.length).toBeGreaterThan(10);
    });
  });
});

describe("computeMeanDeviation", () => {
  test("Beregner korrekt MD for normale punkter", () => {
    const points = [
      { threshold_db: 30, normative_threshold_db: 31 }, // -1 dB
      { threshold_db: 29, normative_threshold_db: 30 }, // -1 dB
      { threshold_db: 28, normative_threshold_db: 30 }, // -2 dB
    ];
    const md = computeMeanDeviation(points);
    expect(md).toBeCloseTo(-1.333, 2);
  });

  test("MD = 0 for perfekt normalt synsfelt", () => {
    const points = GRID_24_2.filter((p) => !p.is_blind_spot).map((p) => ({
      threshold_db: p.normative_threshold_db,
      normative_threshold_db: p.normative_threshold_db,
    }));
    const md = computeMeanDeviation(points);
    expect(md).toBeCloseTo(0, 5);
  });
});
