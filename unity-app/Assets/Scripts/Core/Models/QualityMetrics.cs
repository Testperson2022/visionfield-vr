/// <summary>
/// Kvalitetsmetrics for en testsession.
/// Spejler QualityMetrics i shared/types/index.ts.
/// Bruges til at vurdere testens pålidelighed.
/// </summary>
namespace VisionField.Core.Models
{
    public class QualityMetrics
    {
        /// <summary>False positive rate (0-1). Ugyldig hvis >= 0.20</summary>
        public float FalsePositiveRate;

        /// <summary>False negative rate (0-1). Ugyldig hvis >= 0.33</summary>
        public float FalseNegativeRate;

        /// <summary>Fixation loss rate (0-1). Ugyldig hvis >= 0.20</summary>
        public float FixationLossRate;

        public float TestDurationSeconds;

        /// <summary>false hvis FP >= 0.20 ELLER FN >= 0.33</summary>
        public bool IsReliable;

        public string[] ReliabilityIssues;
    }
}
