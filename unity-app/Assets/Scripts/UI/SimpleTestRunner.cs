using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using VisionField.Core.Tests;

/// <summary>
/// Simple Test Runner — Kører ikke-perimetri tests på PC
///
/// Håndterer: kontrastsensitivitet, farvesyn, visus, stereopsis,
/// Amsler, pupillometri. Viser instruktioner + samler input + viser resultat.
/// </summary>
namespace VisionField.UI
{
    public class SimpleTestRunner : MonoBehaviour
    {
        [Header("UI")]
        [SerializeField] private GameObject _testPanel;
        [SerializeField] private Text _instructionText;
        [SerializeField] private Text _stimulusText;
        [SerializeField] private Text _resultText;
        [SerializeField] private GameObject _resultPanel;

        private TestSelectionMenu.TestType _currentTest;
        private bool _testRunning;
        private bool _waitingForInput;

        // Test instances
        private ContrastSensitivityTest _contrastTest;
        private ColorVisionTest _colorTest;
        private VisualAcuityTest _acuityTest;
        private StereopsisTest _stereoTest;
        private AmslerGridTest _amslerTest;

        public void StartTest(TestSelectionMenu.TestType type)
        {
            _currentTest = type;
            if (_testPanel != null) _testPanel.SetActive(true);
            if (_resultPanel != null) _resultPanel.SetActive(false);

            switch (type)
            {
                case TestSelectionMenu.TestType.ContrastSensitivity:
                    _contrastTest = new ContrastSensitivityTest();
                    StartCoroutine(RunContrastTest());
                    break;
                case TestSelectionMenu.TestType.ColorVision:
                    _colorTest = new ColorVisionTest();
                    StartCoroutine(RunColorTest());
                    break;
                case TestSelectionMenu.TestType.VisualAcuity:
                    _acuityTest = new VisualAcuityTest();
                    StartCoroutine(RunAcuityTest());
                    break;
                case TestSelectionMenu.TestType.Stereopsis:
                    _stereoTest = new StereopsisTest();
                    StartCoroutine(RunStereoTest());
                    break;
                case TestSelectionMenu.TestType.AmslerGrid:
                    _amslerTest = new AmslerGridTest();
                    StartCoroutine(RunAmslerTest());
                    break;
                default:
                    ShowResult("Denne test er ikke implementeret for PC endnu.\n\nTryk SPACE for at gå tilbage.");
                    break;
            }
        }

        private void Update()
        {
            if (_resultPanel != null && _resultPanel.activeSelf && Input.GetKeyDown(KeyCode.Space))
            {
                if (_resultPanel != null) _resultPanel.SetActive(false);
                if (_testPanel != null) _testPanel.SetActive(false);
                var menu = FindFirstObjectByType<TestSelectionMenu>();
                if (menu != null) menu.ShowMenu();
            }
        }

        // ─── Kontrast ────────────────────────────────────────────────
        private IEnumerator RunContrastTest()
        {
            SetInstruction("Kontrastsensitivitet\n\nDu vil se bogstaver med faldende kontrast.\nTryk SPACE hvis du kan se bogstavet.\nTryk N hvis du ikke kan.");

            while (!_contrastTest.IsComplete)
            {
                float contrast = _contrastTest.GetCurrentContrast();
                int level = _contrastTest.CurrentLevel + 1;
                if (_stimulusText != null)
                {
                    _stimulusText.text = "C"; // Simpelt bogstav
                    float c = contrast;
                    _stimulusText.color = new Color(c, c, c, 1f);
                }
                SetInstruction($"Niveau {level}/16 — Kontrast: {(contrast * 100):F0}%\nKan du se bogstavet?\nSPACE = Ja | N = Nej");

                yield return WaitForYesNo();
                _contrastTest.RecordResponse(_lastAnswer);
            }

            ShowResult(
                $"=== Kontrastsensitivitet ===\n\n" +
                $"LogCS: {_contrastTest.LogCS:F2}\n" +
                $"Kontrast-tærskel: {(_contrastTest.ContrastThreshold * 100):F1}%\n" +
                $"Vurdering: {(_contrastTest.IsNormal ? "Normal" : "NEDSAT")}\n\n" +
                "Tryk SPACE for at gå tilbage");
        }

        // ─── Farvesyn ────────────────────────────────────────────────
        private IEnumerator RunColorTest()
        {
            SetInstruction("Farvesyn (Ishihara)\n\nDu vil se tal i farvede prikker.\nIndtast det tal du ser.\nTryk 0 hvis du ikke kan se noget.");

            while (!_colorTest.IsComplete)
            {
                int plate = _colorTest.CurrentPlate + 1;
                int answer = _colorTest.GetCorrectAnswer();
                SetInstruction($"Tavle {plate}/{_colorTest.TotalPlates}\n\nHvilket tal ser du?\n(Simuleret: korrekt svar er {answer})\nTryk SPACE for korrekt | N for forkert");

                yield return WaitForYesNo();
                _colorTest.RecordAnswer(_lastAnswer ? answer : 0);
            }

            var result = _colorTest.GetResult();
            ShowResult(
                $"=== Farvesyn ===\n\n" +
                $"Korrekte: {_colorTest.CorrectCount}/{_colorTest.TotalPlates}\n" +
                $"Resultat: {result}\n\n" +
                "Tryk SPACE for at gå tilbage");
        }

        // ─── Visus ───────────────────────────────────────────────────
        private IEnumerator RunAcuityTest()
        {
            SetInstruction("Synsstyrke (LogMAR)\n\nDu vil se bogstaver i faldende størrelse.\nTryk SPACE hvis du kan læse bogstavet.\nTryk N hvis du ikke kan.");

            while (!_acuityTest.IsComplete)
            {
                var (letter, logMAR, sizeDeg) = _acuityTest.GetNextLetter();
                if (_stimulusText != null)
                {
                    _stimulusText.text = letter.ToString();
                    _stimulusText.fontSize = Mathf.Max(12, (int)(sizeDeg * 200));
                    _stimulusText.color = Color.white;
                }
                SetInstruction($"LogMAR {logMAR:F1} ({VisualAcuityTest.LogMARToSnellen(logMAR)})\nKan du læse bogstavet?\nSPACE = Ja | N = Nej");

                yield return WaitForYesNo();
                _acuityTest.RecordResponse(_lastAnswer);
            }

            ShowResult(
                $"=== Synsstyrke ===\n\n" +
                $"LogMAR: {_acuityTest.LogMAR:F2}\n" +
                $"Snellen: {_acuityTest.Snellen}\n" +
                $"Vurdering: {(_acuityTest.IsNormal ? "Normal" : "NEDSAT")}\n\n" +
                "Tryk SPACE for at gå tilbage");
        }

        // ─── Stereopsis ──────────────────────────────────────────────
        private IEnumerator RunStereoTest()
        {
            SetInstruction("Stereopsis (Dybdesyn)\n\nDu vil se former med dybde-effekt.\nTryk SPACE hvis du kan se dybden.\nTryk N hvis du ikke kan.");

            while (!_stereoTest.IsComplete)
            {
                int disparity = _stereoTest.GetCurrentDisparity();
                SetInstruction($"Disparitet: {disparity} buesekunder\nKan du se dybde-forskellen?\nSPACE = Ja | N = Nej");

                yield return WaitForYesNo();
                _stereoTest.RecordResponse(_lastAnswer);
            }

            ShowResult(
                $"=== Stereopsis ===\n\n" +
                $"Bedste disparitet: {_stereoTest.BestDisparityArcSec} buesekunder\n" +
                $"Vurdering: {_stereoTest.GetClassification()}\n\n" +
                "Tryk SPACE for at gå tilbage");
        }

        // ─── Amsler ──────────────────────────────────────────────────
        private IEnumerator RunAmslerTest()
        {
            SetInstruction("Amsler Grid\n\nSe på gitteret og hold blikket på det røde punkt.\nEr der områder med bølgende eller manglende linjer?\n\nSPACE = Ja (markér) | N = Nej (normalt) | ENTER = Færdig");

            bool done = false;
            while (!done)
            {
                yield return null;
                if (Input.GetKeyDown(KeyCode.Space))
                {
                    _amslerTest.MarkCell(10 + Random.Range(-3, 3), 10 + Random.Range(-3, 3));
                    SetInstruction($"Markeret {_amslerTest.MarkedCount} forvrængede områder.\nFortsæt med SPACE eller afslut med ENTER.");
                }
                if (Input.GetKeyDown(KeyCode.Return))
                {
                    _amslerTest.Complete();
                    done = true;
                }
                if (Input.GetKeyDown(KeyCode.N))
                {
                    _amslerTest.Complete();
                    done = true;
                }
            }

            ShowResult(
                $"=== Amsler Grid ===\n\n" +
                $"Markerede områder: {_amslerTest.MarkedCount}\n" +
                $"Central involvering: {(_amslerTest.CentralInvolved ? "JA" : "Nej")}\n" +
                $"Vurdering: {_amslerTest.GetAssessment()}\n\n" +
                "Tryk SPACE for at gå tilbage");
        }

        // ─── Hjælpefunktioner ────────────────────────────────────────
        private bool _lastAnswer;

        private IEnumerator WaitForYesNo()
        {
            _waitingForInput = true;
            while (_waitingForInput)
            {
                if (Input.GetKeyDown(KeyCode.Space))
                { _lastAnswer = true; _waitingForInput = false; }
                if (Input.GetKeyDown(KeyCode.N))
                { _lastAnswer = false; _waitingForInput = false; }
                yield return null;
            }
        }

        private void SetInstruction(string text)
        {
            if (_instructionText != null) _instructionText.text = text;
        }

        private void ShowResult(string text)
        {
            _testRunning = false;
            if (_testPanel != null) _testPanel.SetActive(false);
            if (_resultPanel != null) _resultPanel.SetActive(true);
            if (_resultText != null) _resultText.text = text;
            Debug.Log(text);
        }
    }
}
