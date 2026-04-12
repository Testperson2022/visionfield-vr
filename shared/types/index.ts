/**
 * VisionField VR — Delte TypeScript-typer
 * Bruges af backend, dashboard og (via JSON-schema) Unity-appen.
 *
 * VIGTIGT: Ændringer her påvirker hele systemet.
 * Kør `npm run typecheck` i alle packages efter ændringer.
 */

// ─── Patient ──────────────────────────────────────────────────────────────────

export interface Patient {
  id: string; // UUID
  cpr_hash: string; // bcrypt-hashet CPR (til søgning)
  first_name_encrypted: string; // AES-256-GCM krypteret
  last_name_encrypted: string;
  birth_year: number;
  created_at: Date;
  updated_at: Date;
}

export interface PatientDisplay {
  id: string;
  first_name: string; // Dekrypteret til visning
  last_name: string;
  birth_year: number;
}

// ─── Test Session ─────────────────────────────────────────────────────────────

export type Eye = "OD" | "OS"; // Oculus Dexter (højre) | Oculus Sinister (venstre)

export type TestStatus =
  | "initializing"
  | "calibrating"
  | "running"
  | "paused"
  | "completed"
  | "aborted"
  | "invalid"; // For høj false pos/neg rate

export interface TestSession {
  id: string; // UUID
  patient_id: string;
  eye: Eye;
  status: TestStatus;
  protocol: TestProtocol;
  started_at: Date;
  completed_at?: Date;
  headset_model: string;
  headset_firmware: string;
  calibration_id: string; // Ref til kalibreringssession
  operator_id: string; // Kliniker/optiker der startede testen

  // Testresultater (null hvis ikke completed)
  results?: TestResults;

  // Kvalitetsmetrics
  quality_metrics?: QualityMetrics;
}

export interface TestProtocol {
  name: "24-2-ZEST-screening" | "24-2-ZEST-full" | "10-2-ZEST-full";
  version: string; // fx "1.0.0"
  grid_points: GridPoint[];
  catch_trial_frequency: number; // Antal catch trials per 10 stimuli
  stop_criterion_sd_db: number; // Default: 1.5
  max_stimuli_per_point: number; // Default: 50
}

// ─── Stimuli og Svar ──────────────────────────────────────────────────────────

export interface GridPoint {
  id: number; // 0-53 for 24-2
  x_deg: number; // Grader fra fiksation (positiv = temporal)
  y_deg: number; // Grader fra fiksation (positiv = superior)
  is_blind_spot: boolean;
  normative_threshold_db: number; // Alderskorrigeret normalværdi
  normative_sd_db: number;
}

export interface StimulusPresentation {
  stimulus_id: string; // UUID
  session_id: string;
  grid_point_id: number;
  presented_at_ms: number; // Ms siden teststart
  duration_ms: 200; // Altid 200ms — konstant
  intensity_db: number; // 0-51 dB
  x_deg: number;
  y_deg: number;
  is_catch_trial: boolean;
  catch_trial_type?: "false_positive" | "false_negative";
}

export interface StimulusResponse {
  stimulus_id: string;
  responded: boolean;
  response_time_ms?: number; // Ms fra stimulus onset (null hvis ingen respons)
  fixation_ok: boolean; // Eye tracking: var blikket stabilt?
  fixation_deviation_deg?: number;
}

// ─── Testresultater ───────────────────────────────────────────────────────────

export interface PointResult {
  grid_point_id: number;
  threshold_db: number; // Estimeret tærskel
  posterior_sd_db: number; // Usikkerhed
  total_deviation_db: number; // Afvigelse fra normativ
  pattern_deviation_db: number; // Korrrigeret for generelt tab
  num_stimuli: number;
}

export interface TestResults {
  point_results: PointResult[];

  // Globale indices
  mean_deviation_db: number; // MD
  mean_deviation_p_value: number;
  pattern_sd_db: number; // PSD
  pattern_sd_p_value: number;
  ght: GHTResult; // Glaucoma Hemifield Test

  // Triage
  triage_classification: TriageClassification;
  triage_recommendation: string;
}

export type GHTResult =
  | "Within normal limits"
  | "Outside normal limits"
  | "Borderline"
  | "General reduction of sensitivity"
  | "Abnormally high sensitivity";

export type TriageClassification = "normal" | "borderline" | "abnormal";

export interface QualityMetrics {
  false_positive_rate: number; // 0-1
  false_negative_rate: number; // 0-1
  fixation_loss_rate: number; // 0-1
  test_duration_seconds: number;
  is_reliable: boolean; // false hvis FP>0.20 eller FN>0.33
  reliability_issues: string[];
}

// ─── Kalibrering ──────────────────────────────────────────────────────────────

export interface CalibrationSession {
  id: string;
  headset_model: string;
  headset_serial: string;
  calibrated_at: Date;
  background_luminance_cdm2: number; // Mål: 10 cd/m²
  max_stimulus_luminance_cdm2: number;
  gamma_correction_table: number[]; // 256 værdier: pixel_intensity → luminans_factor
  warmup_duration_seconds: number; // Tid fra tænd til stabil luminans
  is_valid: boolean;
  valid_until: Date; // Kalibrering udløber efter 30 dage
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string; // Aldrig patientdata i fejlbeskeder
    session_id?: string; // Til audit trail
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// ─── WebSocket Events (Unity ↔ Backend) ──────────────────────────────────────

export type WebSocketEvent =
  | { type: "SESSION_START"; session_id: string; protocol: TestProtocol }
  | { type: "STIMULUS_RESULT"; data: StimulusPresentation & StimulusResponse }
  | { type: "FIXATION_UPDATE"; is_ok: boolean; deviation_deg: number }
  | { type: "SESSION_COMPLETE"; results: TestResults; quality: QualityMetrics }
  | { type: "SESSION_ABORT"; reason: string }
  | { type: "CALIBRATION_UPDATE"; data: Partial<CalibrationSession> }
  | { type: "ERROR"; code: string; recoverable: boolean };
