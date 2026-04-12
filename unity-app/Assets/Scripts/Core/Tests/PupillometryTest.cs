using System;
using System.Collections.Generic;

/// <summary>
/// Pupillometri — Relativ Afferent Pupildefekt (RAPD)
///
/// Swinging Flashlight Test i VR:
/// Lyser skiftevis i hvert øje og måler pupil-respons via eye tracking.
/// Asymmetri indikerer optikusnerve-skade.
///
/// Kræver eye tracking med pupil-størrelse måling.
/// Ref: "Marcus Gunn pupil" / RAPD.
/// </summary>
namespace VisionField.Core.Tests
{
    public class PupillometryTest
    {
        private readonly List<float> _odPupilSizes = new List<float>(); // mm
        private readonly List<float> _osPupilSizes = new List<float>(); // mm
        private int _currentCycle;
        private bool _isComplete;

        public const int REQUIRED_CYCLES = 4; // 4 skift per øje

        public bool IsComplete => _isComplete;
        public int CurrentCycle => _currentCycle;

        /// <summary>Registrer pupil-størrelse under belysning af et øje.</summary>
        public void RecordPupilSize(string eye, float pupilSizeMm)
        {
            if (eye == "OD")
                _odPupilSizes.Add(pupilSizeMm);
            else
                _osPupilSizes.Add(pupilSizeMm);

            _currentCycle = Math.Min(_odPupilSizes.Count, _osPupilSizes.Count);
            if (_currentCycle >= REQUIRED_CYCLES)
                _isComplete = true;
        }

        /// <summary>
        /// Beregn RAPD score.
        /// Positiv = OD defekt, Negativ = OS defekt.
        /// Normal: -0.3 til +0.3 log units.
        /// </summary>
        public float ComputeRAPD()
        {
            if (_odPupilSizes.Count < 2 || _osPupilSizes.Count < 2) return 0f;

            float odMean = Mean(_odPupilSizes);
            float osMean = Mean(_osPupilSizes);

            if (odMean <= 0 || osMean <= 0) return 0f;

            // Log ratio af pupil-konstriktion
            return (float)Math.Log10(osMean / odMean);
        }

        /// <summary>Klassificering.</summary>
        public string GetResult()
        {
            float rapd = ComputeRAPD();
            if (Math.Abs(rapd) < 0.3f) return "Normal — ingen RAPD";
            if (rapd > 0) return $"RAPD OD (+{rapd:F2} log) — mulig optikusneuropati højre";
            return $"RAPD OS ({rapd:F2} log) — mulig optikusneuropati venstre";
        }

        public bool IsNormal => Math.Abs(ComputeRAPD()) < 0.3f;

        private static float Mean(List<float> values)
        {
            float sum = 0;
            foreach (float v in values) sum += v;
            return sum / values.Count;
        }
    }
}
