using System;

/// <summary>
/// Stereopsis Test — Dybdesyn (Titmus/TNO-stil)
///
/// Måler fineste stereoskopiske skarphed i buesekunder.
/// I VR: Præsenterer stereo-par med varierende disparitet.
/// Normal: ≤40 buesekunder. Nedsat: >100 buesekunder.
///
/// Ref: TNO stereotest, Titmus fly test.
/// </summary>
namespace VisionField.Core.Tests
{
    public class StereopsisTest
    {
        // Disparitet-niveauer (buesekunder) — fra grov til fin
        private static readonly int[] DISPARITY_LEVELS = {
            800, 400, 200, 100, 80, 60, 50, 40, 30, 20, 15
        };

        private int _currentLevel;
        private int _consecutiveFails;
        private bool _isComplete;
        private int _bestDisparityArcSec;

        public bool IsComplete => _isComplete;
        public int BestDisparityArcSec => _bestDisparityArcSec;
        public int CurrentLevel => _currentLevel;

        public StereopsisTest()
        {
            _currentLevel = 0;
            _consecutiveFails = 0;
            _bestDisparityArcSec = 0;
        }

        /// <summary>Aktuel disparitet i buesekunder.</summary>
        public int GetCurrentDisparity()
        {
            if (_currentLevel >= DISPARITY_LEVELS.Length) return 0;
            return DISPARITY_LEVELS[_currentLevel];
        }

        /// <summary>Registrer om patienten identificerede dybde korrekt.</summary>
        public void RecordResponse(bool correct)
        {
            if (_isComplete) return;

            if (correct)
            {
                _bestDisparityArcSec = DISPARITY_LEVELS[_currentLevel];
                _consecutiveFails = 0;
                _currentLevel++;
                if (_currentLevel >= DISPARITY_LEVELS.Length)
                    _isComplete = true;
            }
            else
            {
                _consecutiveFails++;
                if (_consecutiveFails >= 2) // 2 fejl på samme niveau = stop
                    _isComplete = true;
            }
        }

        /// <summary>Klassificering af stereopsis.</summary>
        public string GetClassification()
        {
            if (_bestDisparityArcSec <= 40) return "Normal stereopsis";
            if (_bestDisparityArcSec <= 100) return "Let nedsat stereopsis";
            if (_bestDisparityArcSec <= 400) return "Moderat nedsat stereopsis";
            if (_bestDisparityArcSec > 0) return "Svært nedsat stereopsis";
            return "Ingen målbar stereopsis";
        }

        public bool IsNormal => _bestDisparityArcSec > 0 && _bestDisparityArcSec <= 60;
    }
}
