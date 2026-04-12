/// <summary>
/// Samlede testresultater efter afsluttet session.
/// Spejler TestResults i shared/types/index.ts.
/// </summary>
namespace VisionField.Core.Models
{
    public class TestResults
    {
        public PointResult[] PointResults;

        // Globale indices
        /// <summary>Mean Deviation (dB) — gennemsnitlig afvigelse fra normativ</summary>
        public float MeanDeviationDb;
        public float MeanDeviationPValue;

        /// <summary>Pattern Standard Deviation (dB) — lokaliseret tab</summary>
        public float PatternSdDb;
        public float PatternSdPValue;

        /// <summary>Glaucoma Hemifield Test</summary>
        public GHTResult GHT;

        // Triage
        public TriageClassification TriageClassification;
        public string TriageRecommendation;
    }
}
