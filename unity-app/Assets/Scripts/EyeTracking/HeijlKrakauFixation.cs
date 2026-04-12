using VisionField.Core;
using VisionField.Core.Data;
using VisionField.Core.Models;

/// <summary>
/// Heijl-Krakau Fixation Monitoring
///
/// Supplerer eye tracking med blind spot-baseret fiksationskontrol.
/// Præsenterer stimulus ved blind spot — hvis patienten svarer,
/// kigger de ikke på fiksationspunktet.
///
/// Ref: Specvis — "fixation checking using Heijl-Krakau method"
/// Ref: Walsh 2010, p.126
/// </summary>
namespace VisionField.EyeTracking
{
    public class HeijlKrakauFixation
    {
        private readonly int _blindSpotPointId;
        private readonly float _blindSpotX;
        private readonly float _blindSpotY;
        private int _totalChecks;
        private int _fixationLosses;

        /// <summary>Rate of fixation losses (0-1)</summary>
        public float FixationLossRate => _totalChecks > 0 ? (float)_fixationLosses / _totalChecks : 0f;
        public int TotalChecks => _totalChecks;
        public int FixationLosses => _fixationLosses;

        public HeijlKrakauFixation(Eye eye)
        {
            _blindSpotPointId = TestGrid24_2.GetBlindSpotPointId(eye);
            var bp = TestGrid24_2.Grid[_blindSpotPointId];
            _blindSpotX = bp.XDeg;
            _blindSpotY = bp.YDeg;
        }

        /// <summary>
        /// Opret en fiksations-check stimulus ved blind spot.
        /// Intensitet: 25 dB (tydeligt synlig HVIS patienten kigger rigtigt).
        /// </summary>
        public StimulusRequest CreateFixationCheck()
        {
            return new StimulusRequest
            {
                GridPointId = _blindSpotPointId,
                IntensityDb = 25f,
                XDeg = _blindSpotX,
                YDeg = _blindSpotY,
                CatchTrialType = CatchTrialType.FalsePositive
            };
        }

        /// <summary>
        /// Registrer resultat af fiksations-check.
        /// Hvis patienten svarer → fiksation tabt (de kiggede ikke på prikken).
        /// </summary>
        public void RecordResult(bool responded)
        {
            _totalChecks++;
            if (responded)
                _fixationLosses++; // Svarede ved blind spot = fiksation tabt
        }

        /// <summary>Nulstil tællere.</summary>
        public void Reset()
        {
            _totalChecks = 0;
            _fixationLosses = 0;
        }
    }
}
