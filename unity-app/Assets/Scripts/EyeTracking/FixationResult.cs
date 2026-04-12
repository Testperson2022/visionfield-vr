/// <summary>
/// Resultat af fiksationsvurdering under en stimulus-præsentation (200ms vindue).
/// Bruges til at udfylde StimulusResponse.FixationOk og FixationDeviationDeg.
/// </summary>
namespace VisionField.EyeTracking
{
    public readonly struct FixationResult
    {
        /// <summary>Var fiksationen stabil under hele stimulus-præsentationen?</summary>
        public readonly bool IsStable;

        /// <summary>Gennemsnitlig afvigelse fra fiksationspunkt (grader)</summary>
        public readonly float MeanDeviationDeg;

        /// <summary>Peak afvigelse under præsentationen (grader)</summary>
        public readonly float MaxDeviationDeg;

        /// <summary>Antal gaze-samples i vurderingsvinduet</summary>
        public readonly int SampleCount;

        public FixationResult(bool isStable, float meanDeviationDeg,
            float maxDeviationDeg, int sampleCount)
        {
            IsStable = isStable;
            MeanDeviationDeg = meanDeviationDeg;
            MaxDeviationDeg = maxDeviationDeg;
            SampleCount = sampleCount;
        }

        /// <summary>Returnerer ugyldig fiksation (ingen samples tilgængelige).</summary>
        public static FixationResult Invalid => new FixationResult(
            isStable: false, meanDeviationDeg: float.MaxValue,
            maxDeviationDeg: float.MaxValue, sampleCount: 0);
    }

    /// <summary>
    /// Enkelt gaze-sample fra eye tracking API.
    /// Pre-allokeret i GazeRingBuffer for at undgå GC under test.
    /// </summary>
    public struct GazeSample
    {
        /// <summary>Tidspunkt i sekunder (Time.realtimeSinceStartup)</summary>
        public float TimestampSec;

        /// <summary>Gaze-retning i lokal headspace (ALDRIG rå API-koordinater)</summary>
        public UnityEngine.Vector3 DirectionLocal;

        /// <summary>Afvigelse fra fiksationspunkt (grader)</summary>
        public float DeviationDeg;

        /// <summary>Er dette sample valid? (false i warmup-perioden)</summary>
        public bool IsValid;
    }
}
