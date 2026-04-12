using System;
using System.Collections.Generic;
using UnityEngine;

/// <summary>
/// Kinetisk Perimetri — Goldmann-stil
///
/// Bevæger stimulus fra periferi mod center langs meridianer.
/// Patienten svarer når de ser stimulus → isopter-grænse.
/// Bruges til neurologiske defekter og hemianopsi.
///
/// Ref: Walsh 2010, p.88 — "kinetic perimetry"
/// Ref: Goldmann perimeter
/// </summary>
namespace VisionField.Core.Tests
{
    public class KineticPerimetryTest
    {
        /// <summary>Antal meridianer (retninger fra center)</summary>
        public const int NUM_MERIDIANS = 24; // Hver 15°

        /// <summary>Stimulus bevægelseshastighed (grader/sekund)</summary>
        public const float SPEED_DEG_PER_SEC = 4f;

        /// <summary>Startposition (grader fra center)</summary>
        public const float START_ECCENTRICITY = 60f;

        private readonly Dictionary<int, float> _isopterBoundaries;
        private int _currentMeridian;
        private float _currentEccentricity;
        private bool _isComplete;

        public bool IsComplete => _isComplete;
        public int CurrentMeridian => _currentMeridian;

        public KineticPerimetryTest()
        {
            _isopterBoundaries = new Dictionary<int, float>();
            _currentMeridian = 0;
            _currentEccentricity = START_ECCENTRICITY;
        }

        /// <summary>Hent aktuel stimulusposition (bevæger sig indad).</summary>
        public (float xDeg, float yDeg, float eccentricity) GetCurrentPosition()
        {
            float angleRad = _currentMeridian * (360f / NUM_MERIDIANS) * Mathf.Deg2Rad;
            float x = _currentEccentricity * Mathf.Cos(angleRad);
            float y = _currentEccentricity * Mathf.Sin(angleRad);
            return (x, y, _currentEccentricity);
        }

        /// <summary>Flyt stimulus indad (kald hvert frame).</summary>
        public void MoveInward(float deltaTime)
        {
            _currentEccentricity -= SPEED_DEG_PER_SEC * deltaTime;
            if (_currentEccentricity <= 0)
            {
                // Ingen respons langs denne meridian — blind
                _isopterBoundaries[_currentMeridian] = 0f;
                NextMeridian();
            }
        }

        /// <summary>Patient svarede — registrer isopter-grænse.</summary>
        public void RecordResponse()
        {
            _isopterBoundaries[_currentMeridian] = _currentEccentricity;
            NextMeridian();
        }

        private void NextMeridian()
        {
            _currentMeridian++;
            if (_currentMeridian >= NUM_MERIDIANS)
                _isComplete = true;
            else
                _currentEccentricity = START_ECCENTRICITY;
        }

        /// <summary>Hent isopter-grænser for alle meridianer.</summary>
        public Dictionary<int, float> GetIsopterMap() =>
            new Dictionary<int, float>(_isopterBoundaries);

        /// <summary>Detektér hemianopsi (halvsidig blindhed).</summary>
        public string DetectHemianopsia()
        {
            if (!_isComplete) return "Test ikke afsluttet";

            float leftSum = 0, rightSum = 0;
            int leftCount = 0, rightCount = 0;

            foreach (var kvp in _isopterBoundaries)
            {
                float angle = kvp.Key * (360f / NUM_MERIDIANS);
                if (angle > 90 && angle < 270) // Venstre halvfelt
                { leftSum += kvp.Value; leftCount++; }
                else
                { rightSum += kvp.Value; rightCount++; }
            }

            float leftMean = leftCount > 0 ? leftSum / leftCount : 0;
            float rightMean = rightCount > 0 ? rightSum / rightCount : 0;

            if (leftMean < 10 && rightMean > 30) return "Venstre homonym hemianopsi";
            if (rightMean < 10 && leftMean > 30) return "Højre homonym hemianopsi";
            if (leftMean < 20 || rightMean < 20) return "Partiel synsfeltsdefekt";
            return "Normalt perifert synsfelt";
        }
    }
}
