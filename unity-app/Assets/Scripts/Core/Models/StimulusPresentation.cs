/// <summary>
/// Repræsenterer en enkelt stimulus-præsentation.
/// Spejler StimulusPresentation i shared/types/index.ts.
/// </summary>
namespace VisionField.Core.Models
{
    public struct StimulusPresentation
    {
        public string StimulusId;
        public string SessionId;
        public int GridPointId;

        /// <summary>Millisekunder siden teststart</summary>
        public long PresentedAtMs;

        /// <summary>Altid 200ms — klinisk konstant, aldrig variabel</summary>
        public int DurationMs;

        /// <summary>Stimulusintensitet (0-51 dB)</summary>
        public float IntensityDb;

        public float XDeg;
        public float YDeg;
        public bool IsCatchTrial;
        public CatchTrialType CatchTrialType;
    }
}
