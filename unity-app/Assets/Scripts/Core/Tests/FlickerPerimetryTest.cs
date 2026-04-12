using System;
using VisionField.Core.Models;

/// <summary>
/// Flicker Perimetri (FDT — Frequency Doubling Technology)
///
/// Måler sensitivitet for flimrende stimuli.
/// Detekterer tidligt glaukom før standard perimetri.
/// Stimulus: sinusoidal grating der flimrer ved 25 Hz.
///
/// Ref: Maddess T, Henry GH. "Performance of nonlinear visual
/// units in ocular hypertension and glaucoma." 1992.
/// </summary>
namespace VisionField.Core.Tests
{
    public class FlickerPerimetryTest
    {
        /// <summary>Flicker-frekvens (Hz)</summary>
        public const float FLICKER_FREQUENCY_HZ = 25f;

        /// <summary>Spatial frekvens (cpd — cycles per degree)</summary>
        public const float SPATIAL_FREQUENCY_CPD = 0.25f;

        /// <summary>Stimulus størrelse (grader)</summary>
        public const float STIMULUS_SIZE_DEG = 10f;

        // FDT bruger 17 testpunkter (større stimuli end standard)
        private static readonly (float x, float y)[] TEST_LOCATIONS = {
            (0, 0),        // Fovea
            (-10, 10), (10, 10), (-10, -10), (10, -10),       // 4 perifere
            (-20, 0), (20, 0), (0, 20), (0, -20),             // 4 kardinale
            (-10, 0), (10, 0), (0, 10), (0, -10),             // 4 semi-kardinale
            (-20, 10), (20, 10), (-20, -10), (20, -10),       // 4 diagonale
        };

        private readonly float[] _thresholds;
        private int _currentPoint;
        private float _currentContrast;
        private bool _isComplete;

        public bool IsComplete => _isComplete;
        public int CurrentPoint => _currentPoint;
        public int TotalPoints => TEST_LOCATIONS.Length;

        public FlickerPerimetryTest()
        {
            _thresholds = new float[TEST_LOCATIONS.Length];
            _currentPoint = 0;
            _currentContrast = 50f; // Start ved 50% kontrast
        }

        /// <summary>Hent aktuel testposition og kontrast.</summary>
        public (float xDeg, float yDeg, float contrastPercent) GetCurrentStimulus()
        {
            if (_currentPoint >= TEST_LOCATIONS.Length)
                return (0, 0, 0);
            var loc = TEST_LOCATIONS[_currentPoint];
            return (loc.x, loc.y, _currentContrast);
        }

        /// <summary>Registrer respons (simpel staircase).</summary>
        public void RecordResponse(bool seen)
        {
            if (seen)
                _currentContrast -= 5f; // Lavere kontrast
            else
                _currentContrast += 10f; // Højere kontrast

            _currentContrast = Math.Max(1f, Math.Min(100f, _currentContrast));

            // Gem tærskel og gå videre efter 5 præsentationer per punkt
            // (forenklet — rigtig FDT bruger ZEST)
            _thresholds[_currentPoint] = _currentContrast;
            _currentPoint++;
            if (_currentPoint >= TEST_LOCATIONS.Length)
                _isComplete = true;
            else
                _currentContrast = 50f; // Reset for nyt punkt
        }

        /// <summary>Er der signifikante defekter?</summary>
        public bool HasDefects
        {
            get
            {
                int abnormal = 0;
                foreach (float t in _thresholds)
                    if (t > 70f) abnormal++; // Høj kontrast krævet = nedsat
                return abnormal >= 2;
            }
        }
    }
}
