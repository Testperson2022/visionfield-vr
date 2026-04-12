using System;
using UnityEngine;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — Instruktionsskærm (Onboarding)
///
/// Viser patientinstruktioner før test:
/// 1. "Hold blikket på den røde prik"
/// 2. "Tryk på knappen når du ser lysglimt"
/// 3. "Testen tager ca. 4 minutter per øje"
/// 4. "Det er normalt at overse nogle glimt"
///
/// Ref: docs/clinical-protocol-v1.md — patientforberedelse
/// Ref: IEC 62366-1 — usability krav for medicinsk software
/// </summary>
namespace VisionField.UI
{
    public class InstructionsScreen : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _screenRoot;
        [SerializeField] private UnityEngine.UI.Text _instructionText;
        [SerializeField] private UnityEngine.UI.Text _eyeIndicatorText;

        // Instruktions-trin (dansk)
        private static readonly string[] InstructionSteps = new string[]
        {
            "Hold blikket på den røde prik\ni midten af synsfeltet.",
            "Tryk på knappen når du ser\net lysglimt — uanset hvor svagt.",
            "Testen tager ca. 4 minutter\nper øje. Sid stille og afslappet.",
            "Det er helt normalt at overse\nnogle glimt. Gæt ikke — tryk kun\nnår du faktisk ser noget."
        };

        private int _currentStep;
        private Eye _eye;

        /// <summary>Fyres når patienten har læst alle instruktioner og trykker "Start".</summary>
        public event Action OnInstructionsComplete;

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>Vis instruktioner for det angivne øje.</summary>
        public void Show(Eye eye)
        {
            _eye = eye;
            _currentStep = 0;

            if (_screenRoot != null)
                _screenRoot.SetActive(true);

            UpdateEyeIndicator();
            UpdateInstructionText();
        }

        /// <summary>Skjul instruktionsskærm.</summary>
        public void Hide()
        {
            if (_screenRoot != null)
                _screenRoot.SetActive(false);
        }

        /// <summary>
        /// Gå til næste instruktionstrin. Kalder OnInstructionsComplete
        /// når alle trin er vist.
        /// </summary>
        public void NextStep()
        {
            _currentStep++;
            if (_currentStep >= InstructionSteps.Length)
            {
                Hide();
                OnInstructionsComplete?.Invoke();
                return;
            }
            UpdateInstructionText();
        }

        public int CurrentStep => _currentStep;
        public int TotalSteps => InstructionSteps.Length;

        // ─── Private ─────────────────────────────────────────────────

        private void UpdateInstructionText()
        {
            if (_instructionText != null && _currentStep < InstructionSteps.Length)
                _instructionText.text = InstructionSteps[_currentStep];
        }

        private void UpdateEyeIndicator()
        {
            if (_eyeIndicatorText != null)
            {
                string eyeName = _eye == Eye.OD ? "Højre øje (OD)" : "Venstre øje (OS)";
                _eyeIndicatorText.text = eyeName;
            }
        }
    }
}
