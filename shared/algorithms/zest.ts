/**
 * VisionField VR — ZEST Algoritme
 * Zippy Estimation by Sequential Testing
 *
 * Implementerer bayesiansk adaptiv tærskelestimering.
 * Kilde: King-Smith et al. (1994), modificeret af Vingrys & Pianta (1999)
 *
 * KLINISK KRITISK: Denne algoritme er kernen i produktets medicinske funktion.
 * Ændringer kræver re-validering mod normativ database.
 * Tests: zest.test.ts dækker alle edge cases.
 */

import { GridPoint, PointResult } from "./index";

// Psychometrisk funktion (Weibull)
// Sandsynlighed for respons givet stimulusintensitet x og tærskel t
function psychometricFunction(
  x_db: number,
  threshold_db: number,
  slope: number = 0.5,
  false_positive_rate: number = 0.03,
  false_negative_rate: number = 0.03
): number {
  const weibull =
    1 - Math.exp(-Math.pow(10, (slope * (x_db - threshold_db)) / 10));
  return false_positive_rate + (1 - false_positive_rate - false_negative_rate) * weibull;
}

export interface ZestPointState {
  grid_point_id: number;
  // Posterior distribution over mulige tærskler (dB)
  pdf: Float64Array; // Probability Density Function
  db_range: Float64Array; // dB-værdier svarende til pdf
  is_converged: boolean;
  num_stimuli: number;
  estimated_threshold_db: number;
  posterior_sd_db: number;
}

export interface ZestConfig {
  db_min: number; // Minimum testintensitet (typisk 0 dB)
  db_max: number; // Maximum testintensitet (typisk 51 dB)
  db_step: number; // Opløsning (typisk 1 dB)
  stop_sd_db: number; // Stopkriterium: SD under denne værdi → konvergeret
  max_stimuli: number; // Maksimalt antal stimuli per punkt
}

export const DEFAULT_ZEST_CONFIG: ZestConfig = {
  db_min: 0,
  db_max: 51,
  db_step: 1,
  stop_sd_db: 1.5, // Klinisk stopkriterium — må IKKE ændres uden validering
  max_stimuli: 50,
};

export class ZestPoint {
  private state: ZestPointState;
  private config: ZestConfig;

  constructor(
    gridPoint: GridPoint,
    config: ZestConfig = DEFAULT_ZEST_CONFIG
  ) {
    this.config = config;

    // Initialiser db_range array
    const num_steps =
      Math.round((config.db_max - config.db_min) / config.db_step) + 1;
    const db_range = new Float64Array(num_steps);
    for (let i = 0; i < num_steps; i++) {
      db_range[i] = config.db_min + i * config.db_step;
    }

    // Prior distribution: Gaussisk baseret på normative data
    const pdf = new Float64Array(num_steps);
    for (let i = 0; i < num_steps; i++) {
      const x = db_range[i];
      const z = (x - gridPoint.normative_threshold_db) / gridPoint.normative_sd_db;
      pdf[i] = Math.exp(-0.5 * z * z);
    }
    this.normalizePdf(pdf);

    this.state = {
      grid_point_id: gridPoint.id,
      pdf,
      db_range,
      is_converged: false,
      num_stimuli: 0,
      estimated_threshold_db: gridPoint.normative_threshold_db,
      posterior_sd_db: gridPoint.normative_sd_db,
    };
  }

  /**
   * Beregn næste stimulusintensitet (forventet posterior-minimering)
   */
  getNextStimulusDb(): number {
    if (this.state.is_converged) {
      throw new Error(
        `Point ${this.state.grid_point_id} er allerede konvergeret`
      );
    }
    // Vælg stimulus = forventet værdi af posterior
    return this.state.estimated_threshold_db;
  }

  /**
   * Opdater posterior baseret på svar
   * @param stimulus_db - Præsenteret intensitet
   * @param seen - Om patienten svarede
   */
  updateWithResponse(stimulus_db: number, seen: boolean): void {
    const { pdf, db_range } = this.state;

    // Beregn likelihood for hvert muligt tærskelværdi
    for (let i = 0; i < pdf.length; i++) {
      const p_seen = psychometricFunction(stimulus_db, db_range[i]);
      pdf[i] *= seen ? p_seen : 1 - p_seen;
    }

    this.normalizePdf(pdf);
    this.state.num_stimuli++;

    // Opdater estimat og SD
    this.state.estimated_threshold_db = this.computeMean();
    this.state.posterior_sd_db = this.computeSD();

    // Check konvergens
    if (
      this.state.posterior_sd_db < this.config.stop_sd_db ||
      this.state.num_stimuli >= this.config.max_stimuli
    ) {
      this.state.is_converged = true;
    }
  }

  isConverged(): boolean {
    return this.state.is_converged;
  }

  getResult(normative_threshold_db: number): Omit<PointResult, "pattern_deviation_db"> {
    return {
      grid_point_id: this.state.grid_point_id,
      threshold_db: this.state.estimated_threshold_db,
      posterior_sd_db: this.state.posterior_sd_db,
      total_deviation_db: this.state.estimated_threshold_db - normative_threshold_db,
      num_stimuli: this.state.num_stimuli,
    };
  }

  private normalizePdf(pdf: Float64Array): void {
    let sum = 0;
    for (let i = 0; i < pdf.length; i++) sum += pdf[i];
    if (sum === 0) {
      // Fallback: uniform distribution (undgå division med nul)
      pdf.fill(1 / pdf.length);
      return;
    }
    for (let i = 0; i < pdf.length; i++) pdf[i] /= sum;
  }

  private computeMean(): number {
    const { pdf, db_range } = this.state;
    let mean = 0;
    for (let i = 0; i < pdf.length; i++) mean += db_range[i] * pdf[i];
    return mean;
  }

  private computeSD(): number {
    const { pdf, db_range } = this.state;
    const mean = this.computeMean();
    let variance = 0;
    for (let i = 0; i < pdf.length; i++) {
      variance += pdf[i] * Math.pow(db_range[i] - mean, 2);
    }
    return Math.sqrt(variance);
  }
}

// ─── Triage-klassifikation ────────────────────────────────────────────────────

export function classifyTriage(
  md_db: number,
  psd_db: number
): { classification: "normal" | "borderline" | "abnormal"; recommendation: string } {
  if (md_db < -6 || psd_db > 3.0) {
    return {
      classification: "abnormal",
      recommendation:
        "Unormalt synsfelt. Anbefal: Henvisning til øjenlæge inden for 4 uger.",
    };
  }
  if (md_db < -2 || psd_db > 2.0) {
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

export function computeMeanDeviation(
  pointResults: Array<{ threshold_db: number; normative_threshold_db: number }>
): number {
  const deviations = pointResults.map(
    (p) => p.threshold_db - p.normative_threshold_db
  );
  return deviations.reduce((a, b) => a + b, 0) / deviations.length;
}
