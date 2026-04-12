using System;
using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using VisionField.Core;
using VisionField.Core.Models;
using VisionField.Stimuli;

/// <summary>
/// VisionField Desktop — Test Controller
///
/// Kører fuld synsfeltstest på PC med mus/tastatur.
/// Patient fikserer på rød prik midt på skærmen og trykker
/// SPACE eller venstre musetast når de ser et lysglimt.
///
/// Flow: Instruktioner → Test → Resultater
///
/// KLINISK NOTE: Ingen eye tracking — fiksation antages.
/// Egnet til screening, IKKE diagnostisk.
/// </summary>
namespace VisionField.UI
{
    public class DesktopTestController : MonoBehaviour
    {
        [Header("Stimulus")]
        [SerializeField] private DesktopStimulusRenderer _stimulusRenderer;

        [Header("UI Panels")]
        [SerializeField] private GameObject _instructionsPanel;
        [SerializeField] private Text _instructionsText;
        [SerializeField] private GameObject _testPanel;
        [SerializeField] private Text _progressText;
        [SerializeField] private Text _timerText;
        [SerializeField] private GameObject _resultsPanel;
        [SerializeField] private Text _resultsText;

        [Header("Test Config")]
        [SerializeField] private Eye _eye = Eye.OD;

        [Header("Optiker Panel")]
        [SerializeField] private GameObject _operatorPanel;
        [SerializeField] private Text _operatorText;

        // State
        private ZestTestRunner _testRunner;
        private StimulusRequest _currentStimulus;
        private bool _testRunning;
        private bool _waitingForResponse;
        private float _stimulusOnsetTime;
        private float _testStartTime;
        private int _stimuliCount;
        private int _completedPoints;
        private Coroutine _testCoroutine;
        private System.Random _isiRng;
        private bool _firstEyeDone;
        private TestResults _firstEyeResults;
        private QualityMetrics _firstEyeQuality;
        private bool _operatorCheckDone;
        private int _operatorCheckStep;

        private static readonly string[] OperatorChecks = new string[]
        {
            "OPTIKER TJEKLISTE\n\n" +
            "[1/6] Rumbelysning\n" +
            "Er rummet dæmpet? Ingen direkte lys på skærm.\n\n" +
            "Tryk ENTER for at bekræfte",

            "OPTIKER TJEKLISTE\n\n" +
            "[2/6] Skærm-lysstyrke\n" +
            "Er skærmens lysstyrke sat til MAKSIMUM?\n" +
            "Auto-lysstyrke skal være SLUKKET.\n\n" +
            "Tryk ENTER for at bekræfte",

            "OPTIKER TJEKLISTE\n\n" +
            "[3/6] Nattetilstand / f.lux\n" +
            "Er nattetilstand, f.lux og HDR SLUKKET?\n\n" +
            "Tryk ENTER for at bekræfte",

            "OPTIKER TJEKLISTE\n\n" +
            "[4/6] Skærmafstand\n" +
            "Mål 50 cm fra patientens øjne til skærm.\n" +
            "Brug en lineal eller målebånd.\n\n" +
            "Tryk ENTER for at bekræfte",

            "OPTIKER TJEKLISTE\n\n" +
            "[5/6] Patientens korrektion\n" +
            "Har patienten sine briller/linser på?\n" +
            "(Nærkorrektion til 50 cm afstand)\n\n" +
            "Tryk ENTER for at bekræfte",

            "OPTIKER TJEKLISTE\n\n" +
            "[6/6] Øjeafdækning\n" +
            "Dæk patientens VENSTRE øje til.\n" +
            "Vi starter med HØJRE øje (OD).\n\n" +
            "Tryk ENTER for at gå videre til patient-instruktioner",
        };

        private void Start()
        {
            _isiRng = new System.Random();
            ShowOperatorChecklist();
        }

        private void Update()
        {
            // Respons: SPACE eller venstre musetast
            if (_waitingForResponse && (Input.GetKeyDown(KeyCode.Space) || Input.GetMouseButtonDown(0)))
            {
                float responseMs = (Time.realtimeSinceStartup - _stimulusOnsetTime) * 1000f;
                if (responseMs >= 100f) // Anti-anticipation: min 100ms
                {
                    _waitingForResponse = false;
                    RecordResponse(true, responseMs);
                }
            }

            // Optiker tjekliste (ENTER for at gå videre)
            if (!_operatorCheckDone && Input.GetKeyDown(KeyCode.Return))
            {
                _operatorCheckStep++;
                if (_operatorCheckStep >= OperatorChecks.Length)
                {
                    _operatorCheckDone = true;
                    ShowInstructions();
                }
                else
                {
                    ShowOperatorChecklist();
                }
                return;
            }

            // Start test fra instruktioner eller resultater
            if (_operatorCheckDone && !_testRunning &&
                (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space)))
            {
                if (_instructionsPanel != null && _instructionsPanel.activeSelf)
                    StartTest();
                else if (_resultsPanel != null && _resultsPanel.activeSelf && !_firstEyeDone)
                    StartSecondEye();
                else if (_resultsPanel != null && _resultsPanel.activeSelf && _firstEyeDone)
                    ShowFinalReport();
            }

            // Opdatér timer
            if (_testRunning && _timerText != null)
            {
                float elapsed = Time.realtimeSinceStartup - _testStartTime;
                int min = (int)(elapsed / 60f);
                int sec = (int)(elapsed % 60f);
                _timerText.text = $"{min:D2}:{sec:D2}";
            }
        }

        private void ShowOperatorChecklist()
        {
            // Brug instruktionspanelet til optiker-tjekliste
            if (_instructionsPanel != null) _instructionsPanel.SetActive(true);
            if (_testPanel != null) _testPanel.SetActive(false);
            if (_resultsPanel != null) _resultsPanel.SetActive(false);

            if (_instructionsText != null)
                _instructionsText.text = OperatorChecks[_operatorCheckStep];
        }

        private void ShowInstructions()
        {
            if (_instructionsPanel != null) _instructionsPanel.SetActive(true);
            if (_testPanel != null) _testPanel.SetActive(false);
            if (_resultsPanel != null) _resultsPanel.SetActive(false);

            if (_instructionsText != null)
            {
                string eyeName = _eye == Eye.OD ? "HØJRE øje (OD)" : "VENSTRE øje (OS)";
                _instructionsText.text =
                    $"Synsfeltstest — {eyeName}\n\n" +
                    "1. Dæk det andet øje til\n" +
                    "2. Sid 50 cm fra skærmen\n" +
                    "3. Hold blikket på den røde prik\n" +
                    "4. Tryk SPACE når du ser et lysglimt\n" +
                    "5. Det er normalt at overse nogle glimt\n\n" +
                    "Tryk SPACE for at starte";
            }
        }

        private void StartTest()
        {
            if (_instructionsPanel != null) _instructionsPanel.SetActive(false);
            if (_testPanel != null) _testPanel.SetActive(true);
            if (_resultsPanel != null) _resultsPanel.SetActive(false);

            // Screening-mode: max 30 stimuli per punkt (hurtigere end fuld test)
            var screeningConfig = new ZestConfig(
                dbMin: ClinicalConstants.DB_MIN,
                dbMax: ClinicalConstants.DB_MAX,
                dbStep: ClinicalConstants.ZEST_DB_STEP,
                stopSdDb: ClinicalConstants.ZEST_STOP_SD_DB,
                maxStimuli: 30);
            _testRunner = new ZestTestRunner(_eye, screeningConfig,
                catchTrialFrequencyPer10: 1, seed: DateTime.Now.Millisecond);
            _testRunning = true;
            _stimuliCount = 0;
            _completedPoints = 0;
            _testStartTime = Time.realtimeSinceStartup;

            _testCoroutine = StartCoroutine(TestLoop());
        }

        private IEnumerator TestLoop()
        {
            float maxTestDuration = 300f; // Max 5 minutter per øje
            while (_testRunning && !_testRunner.IsComplete &&
                   Time.realtimeSinceStartup - _testStartTime < maxTestDuration)
            {
                _currentStimulus = _testRunner.GetNextStimulus();
                if (_currentStimulus == null) break;

                // Randomiseret ISI (1200-2200ms) — klinisk krav
                float isiMs = ClinicalConstants.MIN_ISI_MS +
                    (float)(_isiRng.NextDouble() *
                    (ClinicalConstants.MAX_ISI_MS - ClinicalConstants.MIN_ISI_MS));
                float isiStart = Time.realtimeSinceStartup;
                while (Time.realtimeSinceStartup - isiStart < isiMs / 1000f)
                    yield return null;

                _stimuliCount++;
                UpdateProgress();

                // Præsentér stimulus (200ms)
                if (_stimulusRenderer != null)
                    _stimulusRenderer.PresentStimulus(_currentStimulus);

                _stimulusOnsetTime = Time.realtimeSinceStartup;
                _waitingForResponse = true;

                // Vent max 1800ms for respons
                float timeout = 1.8f;
                float waitStart = Time.realtimeSinceStartup;
                while (_waitingForResponse && Time.realtimeSinceStartup - waitStart < timeout)
                    yield return null;

                if (_waitingForResponse)
                {
                    _waitingForResponse = false;
                    RecordResponse(false, -1f);
                }
            }

            // Test færdig (konvergeret eller timeout)
            ShowResults();
        }

        private void RecordResponse(bool responded, float responseTimeMs)
        {
            _testRunner.RecordResponse(
                _currentStimulus.GridPointId,
                responded,
                _currentStimulus.IntensityDb,
                fixationOk: true, // Ingen eye tracking på PC
                catchTrialType: _currentStimulus.CatchTrialType
            );

            if (_currentStimulus.CatchTrialType == CatchTrialType.None)
                _completedPoints++;
        }

        private void UpdateProgress()
        {
            if (_progressText != null)
                _progressText.text = $"Stimulus: {_stimuliCount} | Punkt: {_completedPoints} / 52";
        }

        private void ShowResults()
        {
            _testRunning = false;
            float duration = Time.realtimeSinceStartup - _testStartTime;

            var results = _testRunner.ComputeResults();
            var quality = _testRunner.ComputeQualityMetrics(duration);

            if (_testPanel != null) _testPanel.SetActive(false);
            if (_resultsPanel != null) _resultsPanel.SetActive(true);

            // Gem resultater for brug i samlet rapport
            if (_eye == Eye.OD && !_firstEyeDone)
            {
                _firstEyeResults = results;
                _firstEyeQuality = quality;
            }

            string eyeName = _eye == Eye.OD ? "Højre øje (OD)" : "Venstre øje (OS)";

            string nextAction;
            if (_eye == Eye.OD && !_firstEyeDone)
            {
                nextAction = "\nTryk SPACE for at teste VENSTRE øje (OS)";
            }
            else
            {
                nextAction = "\nTryk SPACE for samlet rapport";
            }

            if (_resultsText != null)
            {
                _resultsText.text =
                    $"=== RESULTATER — {eyeName} ===\n\n" +
                    $"Mean Deviation (MD): {results.MeanDeviationDb:F1} dB\n" +
                    $"Pattern SD (PSD): {results.PatternSdDb:F1} dB\n" +
                    $"GHT: {results.GHT}\n\n" +
                    $"TRIAGE: {results.TriageClassification.ToString().ToUpper()}\n" +
                    $"{results.TriageRecommendation}\n\n" +
                    $"Kvalitet:\n" +
                    $"  False Positive: {quality.FalsePositiveRate:P0}\n" +
                    $"  False Negative: {quality.FalseNegativeRate:P0}\n" +
                    $"  Varighed: {duration:F0} sek\n" +
                    $"  Pålidelig: {(quality.IsReliable ? "JA" : "NEJ")}\n\n" +
                    nextAction;
            }

            Debug.Log($"[Desktop Test] {eyeName}: MD={results.MeanDeviationDb:F1} dB, " +
                $"Triage={results.TriageClassification}, Reliable={quality.IsReliable}");
        }

        private void StartSecondEye()
        {
            _firstEyeDone = true;

            // Skift øje
            _eye = Eye.OS;

            // Vis instruktioner for venstre øje
            if (_resultsPanel != null) _resultsPanel.SetActive(false);
            if (_instructionsPanel != null) _instructionsPanel.SetActive(true);

            if (_instructionsText != null)
            {
                _instructionsText.text =
                    "Nu tester vi VENSTRE øje (OS)\n\n" +
                    "1. Dæk HØJRE øje til\n" +
                    "2. Hold blikket på den røde prik\n" +
                    "3. Tryk SPACE når du ser lysglimt\n\n" +
                    "Tryk SPACE for at starte";
            }
        }

        private void ShowFinalReport()
        {
            var secondResults = _testRunner.ComputeResults();
            var secondQuality = _testRunner.ComputeQualityMetrics(
                Time.realtimeSinceStartup - _testStartTime);

            if (_resultsText != null)
            {
                _resultsText.text =
                    "=== SAMLET RAPPORT ===\n\n" +
                    $"HØJRE ØJE (OD):\n" +
                    $"  MD: {_firstEyeResults.MeanDeviationDb:F1} dB\n" +
                    $"  PSD: {_firstEyeResults.PatternSdDb:F1} dB\n" +
                    $"  Triage: {_firstEyeResults.TriageClassification.ToString().ToUpper()}\n" +
                    $"  Pålidelig: {(_firstEyeQuality.IsReliable ? "JA" : "NEJ")}\n\n" +
                    $"VENSTRE ØJE (OS):\n" +
                    $"  MD: {secondResults.MeanDeviationDb:F1} dB\n" +
                    $"  PSD: {secondResults.PatternSdDb:F1} dB\n" +
                    $"  Triage: {secondResults.TriageClassification.ToString().ToUpper()}\n" +
                    $"  Pålidelig: {(secondQuality.IsReliable ? "JA" : "NEJ")}\n\n" +
                    "Test afsluttet. Kontakt din øjenlæge med disse resultater.";
            }

            Debug.Log("[Desktop Test] Begge øjne testet — samlet rapport vist");
        }
    }
}
