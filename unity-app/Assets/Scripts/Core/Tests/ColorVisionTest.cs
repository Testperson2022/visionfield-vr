using System.Collections.Generic;

/// <summary>
/// Farvesyn-test (Ishihara-stil)
///
/// Præsenterer pseudoisokromatiske tavler i VR.
/// Patienten identificerer tal/mønstre i farvede prikker.
/// Detekterer rød-grøn farveblindhed (protanopi/deuteranopi).
///
/// Ref: Ishihara S. "Tests for Colour-Blindness" 1917.
/// </summary>
namespace VisionField.Core.Tests
{
    public enum ColorDeficiency
    {
        Normal,
        MildProtan,      // Let rød-svag
        MildDeutan,      // Let grøn-svag
        StrongProtan,    // Stærk rød-blind
        StrongDeutan,    // Stærk grøn-blind
        Tritan,          // Blå-gul (sjælden)
        Inconclusive
    }

    public class ColorVisionTest
    {
        // Tavle-definitioner: nummer der skal ses + confusion-nummer
        private static readonly (int correct, int protan, int deutan)[] PLATES = {
            (12, 12, 12),   // Kontroltavle (alle ser 12)
            (8, 3, 3),      // Screening
            (6, 5, 5),
            (29, 70, 70),
            (57, 35, 35),
            (5, 2, 2),
            (3, 5, 5),
            (15, 17, 17),
            (74, 21, 21),
            (45, -1, -1),   // -1 = kan ikke læses
            (2, -1, -1),
            (97, -1, -1),
        };

        private int _currentPlate;
        private int _correctCount;
        private int _protanErrors;
        private int _deutanErrors;
        private bool _isComplete;

        public bool IsComplete => _isComplete;
        public int CurrentPlate => _currentPlate;
        public int TotalPlates => PLATES.Length;
        public int CorrectCount => _correctCount;

        /// <summary>Hent korrekt svar for aktuel tavle.</summary>
        public int GetCorrectAnswer() => PLATES[_currentPlate].correct;

        /// <summary>Registrer patientens svar.</summary>
        public void RecordAnswer(int answer)
        {
            if (_isComplete) return;

            var plate = PLATES[_currentPlate];
            if (answer == plate.correct)
            {
                _correctCount++;
            }
            else if (answer == plate.protan)
            {
                _protanErrors++;
            }
            else if (answer == plate.deutan)
            {
                _deutanErrors++;
            }

            _currentPlate++;
            if (_currentPlate >= PLATES.Length)
                _isComplete = true;
        }

        /// <summary>Klassificér farvesynsdefekt.</summary>
        public ColorDeficiency GetResult()
        {
            if (_correctCount >= PLATES.Length - 1) return ColorDeficiency.Normal;
            if (_protanErrors >= 4) return _protanErrors >= 7 ? ColorDeficiency.StrongProtan : ColorDeficiency.MildProtan;
            if (_deutanErrors >= 4) return _deutanErrors >= 7 ? ColorDeficiency.StrongDeutan : ColorDeficiency.MildDeutan;
            if (_correctCount < PLATES.Length / 2) return ColorDeficiency.Inconclusive;
            return ColorDeficiency.Normal;
        }
    }
}
