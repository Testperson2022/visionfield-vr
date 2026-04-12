/// <summary>
/// Resultat for ét testpunkt efter ZEST-konvergens.
/// Spejler PointResult i shared/types/index.ts.
/// </summary>
namespace VisionField.Core.Models
{
    public struct PointResult
    {
        public int GridPointId;

        /// <summary>Estimeret tærskel (dB)</summary>
        public float ThresholdDb;

        /// <summary>Posterior standardafvigelse — usikkerhed (dB)</summary>
        public float PosteriorSdDb;

        /// <summary>Afvigelse fra normativ (dB) = threshold - normativ</summary>
        public float TotalDeviationDb;

        /// <summary>Korrigeret for generelt tab (dB)</summary>
        public float PatternDeviationDb;

        /// <summary>Antal stimuli brugt til dette punkt</summary>
        public int NumStimuli;
    }
}
