using System;

/// <summary>
/// Synsstyrke-test (LogMAR / ETDRS)
///
/// Måler bedste korrigerede synsstyrke via optotyper (bogstaver).
/// I VR: Viser bogstaver i aftagende størrelse.
/// Resultat: LogMAR (0.0 = 6/6 = 20/20, 1.0 = 6/60).
///
/// Ref: ETDRS chart, Bailey-Lovie logMAR chart.
/// </summary>
namespace VisionField.Core.Tests
{
    public class VisualAcuityTest
    {
        // LogMAR niveauer (0.0 = 6/6 normal, positive = dårligere)
        private static readonly float[] LOGMAR_LEVELS = {
            1.0f, 0.9f, 0.8f, 0.7f, 0.6f, 0.5f, 0.4f, 0.3f,
            0.2f, 0.1f, 0.0f, -0.1f, -0.2f, -0.3f
        };

        // ETDRS bogstaver (Sloan letterset)
        private static readonly char[] SLOAN_LETTERS = { 'C', 'D', 'H', 'K', 'N', 'O', 'R', 'S', 'V', 'Z' };

        private int _currentLevel;
        private int _correctOnLine;
        private int _lettersOnLine;
        private int _consecutiveMissedLines;
        private bool _isComplete;
        private float _bestLogMAR;
        private readonly Random _rng;

        public bool IsComplete => _isComplete;
        public float LogMAR => _bestLogMAR;
        public string Snellen => LogMARToSnellen(_bestLogMAR);
        public int CurrentLevel => _currentLevel;

        public VisualAcuityTest()
        {
            _currentLevel = 0;
            _correctOnLine = 0;
            _lettersOnLine = 0;
            _bestLogMAR = 1.0f;
            _rng = new Random();
        }

        /// <summary>Hent næste bogstav og LogMAR-niveau.</summary>
        public (char letter, float logMAR, float sizeDeg) GetNextLetter()
        {
            float logMAR = LOGMAR_LEVELS[_currentLevel];
            char letter = SLOAN_LETTERS[_rng.Next(SLOAN_LETTERS.Length)];
            // Optotype størrelse i grader (5 arcmin ved logMAR 0.0)
            float sizeArcMin = 5f * (float)Math.Pow(10, logMAR);
            float sizeDeg = sizeArcMin / 60f;
            return (letter, logMAR, sizeDeg);
        }

        /// <summary>Registrer om bogstav blev læst korrekt.</summary>
        public void RecordResponse(bool correct)
        {
            if (_isComplete) return;

            _lettersOnLine++;
            if (correct) _correctOnLine++;

            // 5 bogstaver per linje (ETDRS standard)
            if (_lettersOnLine >= 5)
            {
                if (_correctOnLine >= 3) // 3/5 korrekte = linje bestået
                {
                    _bestLogMAR = LOGMAR_LEVELS[_currentLevel];
                    _consecutiveMissedLines = 0;
                }
                else
                {
                    _consecutiveMissedLines++;
                }

                if (_consecutiveMissedLines >= 2 || _currentLevel >= LOGMAR_LEVELS.Length - 1)
                {
                    _isComplete = true;
                    // Justér for delvist korrekte bogstaver (0.02 per bogstav)
                    _bestLogMAR -= _correctOnLine * 0.02f;
                    return;
                }

                _currentLevel++;
                _correctOnLine = 0;
                _lettersOnLine = 0;
            }
        }

        public static string LogMARToSnellen(float logMAR)
        {
            float denominator = 6f * (float)Math.Pow(10, logMAR);
            return $"6/{denominator:F0}";
        }

        public bool IsNormal => _bestLogMAR <= 0.1f; // 6/7.5 eller bedre
    }
}
