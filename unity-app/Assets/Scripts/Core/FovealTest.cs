using System;
using VisionField.Core.Models;

/// <summary>
/// Foveal Sensitivitets-test
///
/// Måler tærskel ved fiksationspunktet (0°, 0°).
/// Vises som "Fovea: XX dB" på printout.
/// Bruger simpel 4-2 staircase (ikke ZEST — kun ét punkt).
///
/// Ref: Humphrey VFA — "Foveal sensitivity" i printout header
/// Ref: Walsh 2010, p.126 — "optional foveal sensitivity"
/// </summary>
namespace VisionField.Core
{
    public class FovealTest
    {
        private float _currentIntensityDb;
        private float _stepSizeDb;
        private int _reversals;
        private bool _lastSeen;
        private bool _isComplete;
        private float _estimatedThresholdDb;
        private int _stimuliCount;

        /// <summary>Foveal normativ tærskel (dB) — typisk 34-36 dB for unge</summary>
        public const float NORMATIVE_FOVEAL_DB = 35f;

        public bool IsComplete => _isComplete;
        public float EstimatedThresholdDb => _estimatedThresholdDb;
        public int StimuliCount => _stimuliCount;

        public FovealTest()
        {
            _currentIntensityDb = 30f; // Start ved typisk niveau
            _stepSizeDb = 4f;          // 4-2 staircase
            _reversals = 0;
            _lastSeen = false;
            _isComplete = false;
            _stimuliCount = 0;
        }

        /// <summary>Hent næste stimulus-intensitet for foveal test.</summary>
        public float GetNextIntensityDb()
        {
            return _currentIntensityDb;
        }

        /// <summary>Registrer respons.</summary>
        public void RecordResponse(bool seen)
        {
            _stimuliCount++;

            // Check for reversal
            if (_stimuliCount > 1 && seen != _lastSeen)
            {
                _reversals++;
                if (_stepSizeDb > 2f) _stepSizeDb = 2f; // 4→2 step
            }

            // Justér intensitet
            if (seen)
                _currentIntensityDb -= _stepSizeDb; // Sænk (gør svagere)
            else
                _currentIntensityDb += _stepSizeDb; // Hæv (gør stærkere)

            // Clamp
            _currentIntensityDb = Math.Max(0f, Math.Min(51f, _currentIntensityDb));

            _lastSeen = seen;

            // Stop efter 2 reversals med step=2 ELLER max 10 stimuli
            if ((_reversals >= 2 && _stepSizeDb <= 2f) || _stimuliCount >= 10)
            {
                _isComplete = true;
                _estimatedThresholdDb = _currentIntensityDb;
            }
        }

        /// <summary>Foveal stimulus request (position 0,0).</summary>
        public StimulusRequest CreateStimulusRequest()
        {
            return new StimulusRequest
            {
                GridPointId = -1, // Special ID for fovea
                IntensityDb = _currentIntensityDb,
                XDeg = 0f,
                YDeg = 0f,
                CatchTrialType = CatchTrialType.None
            };
        }
    }
}
