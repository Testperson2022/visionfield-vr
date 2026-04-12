/// <summary>
/// Patientens respons på en stimulus-præsentation.
/// Spejler StimulusResponse i shared/types/index.ts.
/// </summary>
namespace VisionField.Core.Models
{
    public struct StimulusResponse
    {
        public string StimulusId;
        public bool Responded;

        /// <summary>Millisekunder fra stimulus onset. -1 hvis ingen respons.</summary>
        public float ResponseTimeMs;

        /// <summary>Eye tracking: var blikket stabilt under præsentation?</summary>
        public bool FixationOk;

        /// <summary>Afvigelse fra fiksationspunkt i grader. -1 hvis ukendt.</summary>
        public float FixationDeviationDeg;
    }
}
