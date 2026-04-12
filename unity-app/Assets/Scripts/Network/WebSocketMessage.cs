using System;
using VisionField.Core;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — WebSocket-beskedtyper
///
/// C# mirror af WebSocketEvent union type fra shared/types/index.ts.
/// Definerer alle 7 event-typer for kommunikation mellem Unity og backend.
///
/// SIKKERHED: Ingen patientdata (navne, CPR) må forekomme i beskeder.
/// Kun session_id og anonymiserede målingsdata.
/// </summary>
namespace VisionField.Network
{
    // ─── Event type konstanter (matcher TypeScript) ──────────────────

    public static class EventType
    {
        public const string SESSION_START = "SESSION_START";
        public const string STIMULUS_RESULT = "STIMULUS_RESULT";
        public const string FIXATION_UPDATE = "FIXATION_UPDATE";
        public const string SESSION_COMPLETE = "SESSION_COMPLETE";
        public const string SESSION_ABORT = "SESSION_ABORT";
        public const string CALIBRATION_UPDATE = "CALIBRATION_UPDATE";
        public const string ERROR = "ERROR";
    }

    // ─── Base message ────────────────────────────────────────────────

    /// <summary>Base class for alle WebSocket-beskeder.</summary>
    [Serializable]
    public class WebSocketMessage
    {
        public string type;
    }

    // ─── Backend → Unity (indgående) ─────────────────────────────────

    /// <summary>
    /// Modtages fra backend: Initierer testsession.
    /// Indeholder protocol-konfiguration og session-ID.
    /// </summary>
    [Serializable]
    public class SessionStartMessage : WebSocketMessage
    {
        public string session_id;
        public ProtocolData protocol;

        public SessionStartMessage()
        {
            type = EventType.SESSION_START;
        }
    }

    /// <summary>Protocol-data som modtaget fra backend.</summary>
    [Serializable]
    public class ProtocolData
    {
        public string name;     // "24-2-ZEST-screening" | "24-2-ZEST-full" | "10-2-ZEST-full"
        public string version;  // fx "1.0.0"
        public int catch_trial_frequency;     // Per 10 stimuli
        public float stop_criterion_sd_db;    // Default: 1.5
        public int max_stimuli_per_point;     // Default: 50
    }

    /// <summary>
    /// Modtages fra backend: Kalibrerings-opdatering.
    /// Indeholder gamma-korrektions-tabel og luminans-data.
    /// </summary>
    [Serializable]
    public class CalibrationUpdateMessage : WebSocketMessage
    {
        public CalibrationData data;

        public CalibrationUpdateMessage()
        {
            type = EventType.CALIBRATION_UPDATE;
        }
    }

    [Serializable]
    public class CalibrationData
    {
        public float background_luminance_cdm2;
        public float max_stimulus_luminance_cdm2;
        public float[] gamma_correction_table;  // 256 værdier
        public float warmup_duration_seconds;
        public bool is_valid;
    }

    // ─── Unity → Backend (udgående) ──────────────────────────────────

    /// <summary>
    /// Sendes til backend: Resultat af én stimulus-præsentation.
    /// Kombinerer StimulusPresentation + StimulusResponse.
    /// SIKKERHED: Indeholder KUN stimulus-data + session_id, ALDRIG patientdata.
    /// </summary>
    [Serializable]
    public class StimulusResultMessage : WebSocketMessage
    {
        // Præsentation
        public string stimulus_id;
        public string session_id;
        public int grid_point_id;
        public long presented_at_ms;
        public int duration_ms;       // Altid 200 (ClinicalConstants.STIMULUS_DURATION_MS)
        public float intensity_db;
        public float x_deg;
        public float y_deg;
        public bool is_catch_trial;
        public string catch_trial_type;  // "false_positive" | "false_negative" | null

        // Respons
        public bool responded;
        public float response_time_ms;   // -1 hvis ingen respons
        public bool fixation_ok;
        public float fixation_deviation_deg;

        public StimulusResultMessage()
        {
            type = EventType.STIMULUS_RESULT;
            duration_ms = ClinicalConstants.STIMULUS_DURATION_MS; // Altid 200ms
        }
    }

    /// <summary>
    /// Sendes til backend: Live fiksationsstatus (10Hz).
    /// Bruges af klinikertablet til realtidsmonitorering.
    /// </summary>
    [Serializable]
    public class FixationUpdateMessage : WebSocketMessage
    {
        public bool is_ok;
        public float deviation_deg;

        public FixationUpdateMessage()
        {
            type = EventType.FIXATION_UPDATE;
        }
    }

    /// <summary>
    /// Sendes til backend: Testsession afsluttet med resultater.
    /// </summary>
    [Serializable]
    public class SessionCompleteMessage : WebSocketMessage
    {
        public SessionResultsData results;
        public QualityData quality;

        public SessionCompleteMessage()
        {
            type = EventType.SESSION_COMPLETE;
        }
    }

    [Serializable]
    public class SessionResultsData
    {
        public PointResultData[] point_results;
        public float mean_deviation_db;
        public float pattern_sd_db;
        public string ght;
        public string triage_classification;
        public string triage_recommendation;
    }

    [Serializable]
    public class PointResultData
    {
        public int grid_point_id;
        public float threshold_db;
        public float posterior_sd_db;
        public float total_deviation_db;
        public float pattern_deviation_db;
        public int num_stimuli;
    }

    [Serializable]
    public class QualityData
    {
        public float false_positive_rate;
        public float false_negative_rate;
        public float fixation_loss_rate;
        public float test_duration_seconds;
        public bool is_reliable;
        public string[] reliability_issues;
    }

    // ─── Bidirektionelle ─────────────────────────────────────────────

    /// <summary>Testsession afbrudt.</summary>
    [Serializable]
    public class SessionAbortMessage : WebSocketMessage
    {
        public string reason;

        public SessionAbortMessage()
        {
            type = EventType.SESSION_ABORT;
        }
    }

    /// <summary>
    /// Fejlbesked.
    /// SIKKERHED: Må ALDRIG indeholde patientdata — kun generisk kode + session_id.
    /// </summary>
    [Serializable]
    public class ErrorMessage : WebSocketMessage
    {
        public string code;
        public bool recoverable;

        public ErrorMessage()
        {
            type = EventType.ERROR;
        }
    }
}
