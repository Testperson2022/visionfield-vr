/// <summary>
/// VisionField VR — Kliniske konstanter
///
/// KLINISK KRITISK: Værdierne i denne fil er medicinsk regulerede (MDR 2017/745).
/// Ændringer kræver klinisk godkendelse og re-validering.
/// Se: docs/clinical-protocol-v1.md
/// </summary>
namespace VisionField.Core
{
    public static class ClinicalConstants
    {
        // ─── Stimulus timing ─────────────────────────────────────────────
        // KRITISK: Disse værdier må ALDRIG gøres dynamiske eller framerate-afhængige.
        // Ref: lessons.md [2025-01] — stimulus duration er hardcoded konstant.

        /// <summary>Goldmann standard stimulusvarighed. ALDRIG variabel.</summary>
        public const int STIMULUS_DURATION_MS = 200;

        /// <summary>Tolerance for stimulustiming (±5ms)</summary>
        public const int STIMULUS_TIMING_TOLERANCE_MS = 5;

        /// <summary>Minimum inter-stimulus interval (ms)</summary>
        public const int MIN_ISI_MS = 1200;

        /// <summary>Maximum inter-stimulus interval (ms)</summary>
        public const int MAX_ISI_MS = 2200;

        // ─── Stimulus geometri ───────────────────────────────────────────

        /// <summary>Goldmann størrelse III (grader diameter)</summary>
        public const float STIMULUS_DIAMETER_DEG = 0.43f;

        /// <summary>Fiksationspunkt diameter (grader)</summary>
        public const float FIXATION_POINT_DIAMETER_DEG = 0.3f;

        // ─── Luminans ────────────────────────────────────────────────────

        /// <summary>Baggrundsluminans (cd/m²) — kalibreret Goldmann-standard</summary>
        public const float BACKGROUND_LUMINANCE_CDM2 = 10f;

        /// <summary>Minimum stimulusluminans (cd/m²) — svarende til 51 dB</summary>
        public const float MIN_STIMULUS_LUMINANCE_CDM2 = 0.08f;

        /// <summary>Maximum stimulusluminans (cd/m²) — svarende til 0 dB</summary>
        public const float MAX_STIMULUS_LUMINANCE_CDM2 = 3183f;

        /// <summary>Stimulusintensitet range i dB</summary>
        public const float DB_MIN = 0f;
        public const float DB_MAX = 51f;

        // ─── ZEST-algoritme ──────────────────────────────────────────────

        /// <summary>
        /// Stopkriterium: posterior SD under denne værdi → konvergeret.
        /// KRITISK: Må IKKE ændres uden klinisk godkendelse.
        /// Ref: lessons.md [2025-01] — udelukkende posterior_sd < 1.5 dB.
        /// </summary>
        public const float ZEST_STOP_SD_DB = 1.5f;

        /// <summary>Maksimalt antal stimuli per testpunkt</summary>
        public const int ZEST_MAX_STIMULI_PER_POINT = 50;

        /// <summary>dB opløsning for posterior distribution</summary>
        public const float ZEST_DB_STEP = 1f;

        // ─── Catch trials og kvalitetskontrol ────────────────────────────

        /// <summary>
        /// False positive rate grænse — over dette markeres "low patient reliability".
        /// Ref: Walsh 2010, p.126 — "if false-positive or false-negative errors reach 33%"
        /// </summary>
        public const float MAX_FALSE_POSITIVE_RATE = 0.33f;

        /// <summary>False negative rate grænse — over dette er testen upålidelig</summary>
        public const float MAX_FALSE_NEGATIVE_RATE = 0.33f;

        /// <summary>Fixation loss rate grænse</summary>
        public const float MAX_FIXATION_LOSS_RATE = 0.20f;

        // ─── Triage-klassifikation ───────────────────────────────────────

        /// <summary>MD grænse for normal (dB) — over dette = normal</summary>
        public const float TRIAGE_NORMAL_MD_THRESHOLD = -2f;

        /// <summary>MD grænse for abnormal (dB) — under dette = abnormal</summary>
        public const float TRIAGE_ABNORMAL_MD_THRESHOLD = -6f;

        /// <summary>PSD grænse for normal (dB)</summary>
        public const float TRIAGE_NORMAL_PSD_THRESHOLD = 2.0f;

        /// <summary>PSD grænse for abnormal (dB)</summary>
        public const float TRIAGE_ABNORMAL_PSD_THRESHOLD = 3.0f;

        // ─── Eye tracking ────────────────────────────────────────────────

        /// <summary>
        /// Minimum ventetid efter eye tracking start, før kalibrering.
        /// Ref: lessons.md [2025-01] — API returnerer null i første 2-3 frames.
        /// </summary>
        public const int EYE_TRACKING_WARMUP_MS = 500;

        /// <summary>Maximum afvigelse fra fiksationspunkt for stabil fiksation (grader)</summary>
        public const float FIXATION_THRESHOLD_DEG = 2.0f;

        /// <summary>Meta Quest 3 eye tracking sample rate (Hz)</summary>
        public const int EYE_TRACKING_SAMPLE_RATE_HZ = 90;

        /// <summary>Target kalibreringslængde (ms) — 10-15 sek auto-kalibrering</summary>
        public const int CALIBRATION_DURATION_MS = 12000;

        /// <summary>Antal fiksationspunkter i kalibreringssekvens</summary>
        public const int CALIBRATION_TARGET_COUNT = 5;

        // ─── Psychometrisk funktion ──────────────────────────────────────

        /// <summary>Weibull slope parameter</summary>
        public const float PSYCHOMETRIC_SLOPE = 0.5f;

        /// <summary>Baseline false positive rate i psychometrisk funktion</summary>
        public const float PSYCHOMETRIC_FALSE_POSITIVE = 0.03f;

        /// <summary>Baseline false negative rate i psychometrisk funktion</summary>
        public const float PSYCHOMETRIC_FALSE_NEGATIVE = 0.03f;
    }
}
