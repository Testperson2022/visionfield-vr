/// <summary>
/// Et punkt i testgitteret med normative referencedata.
/// Spejler GridPoint i shared/types/index.ts.
/// KLINISK KRITISK: Koordinater og normative data må IKKE ændres uden klinisk validering.
/// </summary>
namespace VisionField.Core.Models
{
    public readonly struct GridPoint
    {
        /// <summary>Punkt-ID (0-53 for 24-2)</summary>
        public readonly int Id;

        /// <summary>Grader fra fiksation, positiv = temporal</summary>
        public readonly float XDeg;

        /// <summary>Grader fra fiksation, positiv = superior</summary>
        public readonly float YDeg;

        public readonly bool IsBlindSpot;

        /// <summary>Alderskorrigeret normalværdi (dB). Kilde: Heijl et al. 1987</summary>
        public readonly float NormativeThresholdDb;

        /// <summary>Normativ standardafvigelse (dB)</summary>
        public readonly float NormativeSdDb;

        public GridPoint(int id, float xDeg, float yDeg, bool isBlindSpot,
            float normativeThresholdDb, float normativeSdDb)
        {
            Id = id;
            XDeg = xDeg;
            YDeg = yDeg;
            IsBlindSpot = isBlindSpot;
            NormativeThresholdDb = normativeThresholdDb;
            NormativeSdDb = normativeSdDb;
        }
    }
}
