using System;

/// <summary>
/// Kontrastsensitivitets-test (Pelli-Robson stil)
///
/// Måler den laveste kontrast patienten kan se ved fast størrelse.
/// Resultat: log kontrast sensitivitet (logCS).
/// Normal: 1.65-2.0 logCS. Nedsat: &lt;1.5 logCS.
///
/// Ref: Pelli DG, Robson JG, Wilkins AJ. "The design of a new
/// letter chart for measuring contrast sensitivity." 1988.
/// </summary>
namespace VisionField.Core.Tests
{
    public class ContrastSensitivityTest
    {
        // Kontrast-niveauer (Pelli-Robson: 8 triplets, 16 niveauer)
        private static readonly float[] CONTRAST_LEVELS = {
            1.00f, 0.70f, 0.50f, 0.35f, 0.25f, 0.18f, 0.12f, 0.09f,
            0.06f, 0.04f, 0.03f, 0.02f, 0.015f, 0.01f, 0.007f, 0.005f
        };

        private int _currentLevel;
        private int _correctInTriplet;
        private int _tripletIndex;
        private bool _isComplete;
        private float _lastCorrectContrast;

        public bool IsComplete => _isComplete;
        public float LogCS => _isComplete ? -(float)Math.Log10(_lastCorrectContrast) : 0f;
        public float ContrastThreshold => _lastCorrectContrast;
        public int CurrentLevel => _currentLevel;

        public ContrastSensitivityTest()
        {
            _currentLevel = 0;
            _correctInTriplet = 0;
            _tripletIndex = 0;
            _lastCorrectContrast = 1.0f;
        }

        /// <summary>Hent aktuel kontrast (0-1) for næste stimulus.</summary>
        public float GetCurrentContrast()
        {
            if (_currentLevel >= CONTRAST_LEVELS.Length) return 0f;
            return CONTRAST_LEVELS[_currentLevel];
        }

        /// <summary>Registrer om patienten svarede korrekt.</summary>
        public void RecordResponse(bool correct)
        {
            if (_isComplete) return;

            _tripletIndex++;

            if (correct)
            {
                _correctInTriplet++;
                _lastCorrectContrast = CONTRAST_LEVELS[_currentLevel];
            }

            // Hvert niveau testes 3 gange (triplet)
            if (_tripletIndex >= 3)
            {
                if (_correctInTriplet >= 2)
                {
                    // 2/3 korrekte → gå videre til lavere kontrast
                    _currentLevel++;
                    if (_currentLevel >= CONTRAST_LEVELS.Length)
                    {
                        _isComplete = true;
                        return;
                    }
                }
                else
                {
                    // <2/3 korrekte → stop
                    _isComplete = true;
                    return;
                }

                _correctInTriplet = 0;
                _tripletIndex = 0;
            }
        }

        /// <summary>Er resultatet normalt? (logCS ≥ 1.5)</summary>
        public bool IsNormal => LogCS >= 1.5f;
    }
}
