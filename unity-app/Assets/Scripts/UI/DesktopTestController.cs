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

        private void Start()
        {
            _isiRng = new System.Random();
            ShowInstructions();
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

            // Start test fra instruktioner
            if (!_testRunning && _instructionsPanel != null && _instructionsPanel.activeSelf)
            {
                if (Input.GetKeyDown(KeyCode.Return) || Input.GetKeyDown(KeyCode.Space))
                    StartTest();
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
            while (_testRunning && !_testRunner.IsComplete)
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

            if (_testRunner.IsComplete)
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

            string triageColor =
                results.TriageClassification == TriageClassification.Normal ? "green" :
                results.TriageClassification == TriageClassification.Borderline ? "yellow" : "red";

            string eyeName = _eye == Eye.OD ? "Højre øje (OD)" : "Venstre øje (OS)";

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
                    $"Stimuli: {_stimuliCount}\n\n" +
                    "Tryk SPACE for ny test";
            }

            Debug.Log($"[Desktop Test] {eyeName}: MD={results.MeanDeviationDb:F1} dB, " +
                $"Triage={results.TriageClassification}, Reliable={quality.IsReliable}");
        }
    }
}
