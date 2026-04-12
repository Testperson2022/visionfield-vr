/// <summary>
/// VisionField VR — Kliniske enums
/// Spejler shared/types/index.ts
/// </summary>
namespace VisionField.Core.Models
{
    /// <summary>Oculus Dexter (højre) / Oculus Sinister (venstre)</summary>
    public enum Eye
    {
        OD, // Højre øje
        OS  // Venstre øje
    }

    public enum TestStatus
    {
        Initializing,
        Calibrating,
        Running,
        Paused,
        Completed,
        Aborted,
        Invalid // For høj false pos/neg rate
    }

    public enum TriageClassification
    {
        Normal,
        Borderline,
        Abnormal
    }

    public enum GHTResult
    {
        WithinNormalLimits,
        OutsideNormalLimits,
        Borderline,
        GeneralReductionOfSensitivity,
        AbnormallyHighSensitivity
    }

    public enum CatchTrialType
    {
        None,
        FalsePositive, // Stimulus ved blind spot — forventer ingen respons
        FalseNegative  // Stimulus over estimeret tærskel — forventer respons
    }
}
