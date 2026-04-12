using System;
using System.Collections;
using UnityEngine;
using VisionField.Core;
using VisionField.Core.Models;
using VisionField.EyeTracking;
using VisionField.Network;
using VisionField.Stimuli;

/// <summary>
/// VisionField VR — Test State Machine
///
/// Central controller der driver hele testflowet:
/// Initializing → Calibrating → Running → Completed/Invalid
///
/// Binder alle komponenter sammen:
/// - ZestTestRunner (algoritme)
/// - StimulusRenderer (visning)
/// - EyeTrackingController (fiksation)
/// - VRInputHandler (patient-input)
/// - TestSessionSync (WebSocket)
/// - UI screens (HUD, instruktioner, resultater)
///
/// KLINISK KRITISK: State transitions skal være deterministiske
/// og testbare. Stimulus-timing er 200ms (aldrig variabel).
/// ISI randomiseres 1200-2200ms.
/// </summary>
namespace VisionField.UI
{
    public class TestStateMachine : MonoBehaviour
    {
        [Header("Components")]
        [SerializeField] private StimulusRenderer _stimulusRenderer;
        [SerializeField] private EyeTrackingController _eyeTrackingController;
        [SerializeField] private VRInputHandler _inputHandler;
        [SerializeField] private TestSessionSync _sessionSync;

        [Header("UI Screens")]
        [SerializeField] private InstructionsScreen _instructionsScreen;
        [SerializeField] private TestHUD _testHUD;
        [SerializeField] private ResultsScreen _resultsScreen;

        // State
        private TestStatus _currentState = TestStatus.Initializing;
        private Eye _currentEye = Eye.OD;
        private Coroutine _testLoopCoroutine;
        private StimulusRequest _currentStimulus;
        private System.Random _isiRng;
        private int _completedPoints;

        // ─── Public properties ───────────────────────────────────────

        public TestStatus CurrentState => _currentState;
        public Eye CurrentEye => _currentEye;

        // ─── Events ──────────────────────────────────────────────────

        /// <summary>State ændret.</summary>
        public event Action<TestStatus, TestStatus> OnStateChanged; // old, new

        // ─── Lifecycle ───────────────────────────────────────────────

        private void Awake()
        {
            _isiRng = new System.Random();
        }

        private void Start()
        {
            SubscribeEvents();
            TransitionTo(TestStatus.Initializing);
        }

        private void OnDestroy()
        {
            UnsubscribeEvents();
        }

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>Start test for et specifikt øje.</summary>
        public void StartTest(Eye eye)
        {
            _currentEye = eye;
            TransitionTo(TestStatus.Initializing);
        }

        /// <summary>Pause/resume test.</summary>
        public void TogglePause()
        {
            if (_currentState == TestStatus.Running)
                TransitionTo(TestStatus.Paused);
            else if (_currentState == TestStatus.Paused)
                TransitionTo(TestStatus.Running);
        }

        /// <summary>Afbryd test.</summary>
        public void AbortTest()
        {
            if (_testLoopCoroutine != null)
            {
                StopCoroutine(_testLoopCoroutine);
                _testLoopCoroutine = null;
            }
            TransitionTo(TestStatus.Aborted);
        }

        // ─── State transitions ───────────────────────────────────────

        /// <summary>
        /// Central state transition. Alle state-ændringer går gennem denne.
        /// Validerer gyldige overgange.
        /// </summary>
        public void TransitionTo(TestStatus newState)
        {
            TestStatus oldState = _currentState;

            // Validér overgang
            if (!IsValidTransition(oldState, newState))
            {
                Debug.LogWarning(
                    $"[TestStateMachine] Ugyldig overgang: {oldState} → {newState}");
                return;
            }

            _currentState = newState;
            OnStateChanged?.Invoke(oldState, newState);

            // Udfør state entry-logik
            switch (newState)
            {
                case TestStatus.Initializing:
                    EnterInitializing();
                    break;
                case TestStatus.Calibrating:
                    EnterCalibrating();
                    break;
                case TestStatus.Running:
                    EnterRunning(oldState == TestStatus.Paused);
                    break;
                case TestStatus.Paused:
                    EnterPaused();
                    break;
                case TestStatus.Completed:
                    EnterCompleted();
                    break;
                case TestStatus.Invalid:
                    EnterInvalid();
                    break;
                case TestStatus.Aborted:
                    EnterAborted();
                    break;
            }
        }

        /// <summary>Validér om en state-overgang er tilladt.</summary>
        public static bool IsValidTransition(TestStatus from, TestStatus to)
        {
            switch (from)
            {
                case TestStatus.Initializing:
                    return to == TestStatus.Calibrating || to == TestStatus.Aborted;

                case TestStatus.Calibrating:
                    return to == TestStatus.Running || to == TestStatus.Aborted;

                case TestStatus.Running:
                    return to == TestStatus.Paused || to == TestStatus.Completed
                        || to == TestStatus.Invalid || to == TestStatus.Aborted;

                case TestStatus.Paused:
                    return to == TestStatus.Running || to == TestStatus.Aborted;

                case TestStatus.Completed:
                    return to == TestStatus.Initializing; // Ny test (andet øje)

                case TestStatus.Invalid:
                    return to == TestStatus.Initializing; // Retry

                case TestStatus.Aborted:
                    return to == TestStatus.Initializing; // Retry

                default:
                    return false;
            }
        }

        // ─── State entry-logik ───────────────────────────────────────

        private void EnterInitializing()
        {
            // Stop eventuel kørende test
            if (_testLoopCoroutine != null)
            {
                StopCoroutine(_testLoopCoroutine);
                _testLoopCoroutine = null;
            }

            _completedPoints = 0;

            // Vis instruktioner, skjul andre screens
            if (_instructionsScreen != null) _instructionsScreen.Show(_currentEye);
            if (_testHUD != null) _testHUD.Hide();
            if (_resultsScreen != null) _resultsScreen.Hide();
        }

        private void EnterCalibrating()
        {
            if (_instructionsScreen != null) _instructionsScreen.Hide();

            // Start eye tracking med warmup
            if (_eyeTrackingController != null)
                _eyeTrackingController.StartTracking();

            // Kalibrering afsluttes via EyeTrackingController.OnCalibrationComplete event
            // som trigger TransitionTo(Running)
        }

        private void EnterRunning(bool isResume)
        {
            if (_testHUD != null && !isResume)
                _testHUD.Show();

            // Start eller genoptag stimulus-loop
            if (_testLoopCoroutine == null)
                _testLoopCoroutine = StartCoroutine(StimulusLoopCoroutine());
        }

        private void EnterPaused()
        {
            // Pause stimulus-loop (coroutine checker _currentState)
            if (_stimulusRenderer != null)
                _stimulusRenderer.CancelStimulus();
        }

        private void EnterCompleted()
        {
            if (_testHUD != null) _testHUD.Hide();

            // Resultater hentes fra TestSessionSync event
        }

        private void EnterInvalid()
        {
            if (_testHUD != null) _testHUD.Hide();
        }

        private void EnterAborted()
        {
            if (_testHUD != null) _testHUD.Hide();
            if (_instructionsScreen != null) _instructionsScreen.Hide();

            if (_sessionSync != null)
                _sessionSync.AbortTest("USER_ABORT");
        }

        // ─── Stimulus-loop coroutine ─────────────────────────────────

        /// <summary>
        /// Hovedloop under test:
        /// 1. Hent næste stimulus fra ZEST
        /// 2. Randomisér ISI (1200-2200ms)
        /// 3. Præsentér stimulus (200ms)
        /// 4. Vent respons eller timeout
        /// 5. Registrér resultat
        /// 6. Gentag
        /// </summary>
        private IEnumerator StimulusLoopCoroutine()
        {
            while (_currentState == TestStatus.Running)
            {
                // Hent næste stimulus
                _currentStimulus = _sessionSync != null
                    ? _sessionSync.GetNextStimulus()
                    : null;

                if (_currentStimulus == null)
                {
                    // Test færdig
                    break;
                }

                // Randomiseret inter-stimulus interval (anti-anticipation)
                float isiMs = ClinicalConstants.MIN_ISI_MS +
                    (float)(_isiRng.NextDouble() *
                    (ClinicalConstants.MAX_ISI_MS - ClinicalConstants.MIN_ISI_MS));
                float isiStartTime = Time.realtimeSinceStartup;
                while (Time.realtimeSinceStartup - isiStartTime < isiMs / 1000f)
                {
                    // Check for pause under ISI
                    if (_currentState != TestStatus.Running)
                    {
                        while (_currentState == TestStatus.Paused)
                            yield return null;
                        if (_currentState != TestStatus.Running)
                            yield break;
                    }
                    yield return null;
                }

                // Præsentér stimulus (200ms)
                if (_stimulusRenderer != null)
                    _stimulusRenderer.PresentStimulus(_currentStimulus);

                // Åbn responsvindue
                if (_inputHandler != null)
                    _inputHandler.OpenResponseWindow();

                // Vent til stimulus er vist + responsvindue lukker
                while (_inputHandler != null && _inputHandler.IsResponseWindowOpen)
                {
                    if (_currentState != TestStatus.Running)
                        yield break;
                    yield return null;
                }

                // Evaluer fiksation under stimulus
                FixationResult fixation = _eyeTrackingController != null
                    ? _eyeTrackingController.EvaluateFixationDuringStimulus()
                    : new FixationResult(true, 0f, 0f, 0);

                // Registrér resultat
                bool responded = _inputHandler != null && _inputHandler.HasResponded;
                float responseTimeMs = _inputHandler != null
                    ? _inputHandler.GetResponseTimeMs()
                    : -1f;

                if (_sessionSync != null)
                {
                    _sessionSync.RecordAndSendStimulusResult(
                        _currentStimulus, responded, responseTimeMs, fixation);
                }

                // Opdatér HUD
                if (_currentStimulus.CatchTrialType == CatchTrialType.None)
                {
                    _completedPoints++;
                    if (_testHUD != null)
                        _testHUD.SetCompletedPoints(_completedPoints);
                }
            }

            _testLoopCoroutine = null;
        }

        // ─── Event handlers ──────────────────────────────────────────

        private void SubscribeEvents()
        {
            if (_instructionsScreen != null)
                _instructionsScreen.OnInstructionsComplete += HandleInstructionsComplete;

            if (_eyeTrackingController != null)
                _eyeTrackingController.OnCalibrationComplete += HandleCalibrationComplete;

            if (_sessionSync != null)
            {
                _sessionSync.OnTestCompleted += HandleTestCompleted;
                _sessionSync.OnTestAborted += HandleTestAborted;
            }

            if (_inputHandler != null)
                _inputHandler.OnPausePressed += HandlePausePressed;
        }

        private void UnsubscribeEvents()
        {
            if (_instructionsScreen != null)
                _instructionsScreen.OnInstructionsComplete -= HandleInstructionsComplete;

            if (_eyeTrackingController != null)
                _eyeTrackingController.OnCalibrationComplete -= HandleCalibrationComplete;

            if (_sessionSync != null)
            {
                _sessionSync.OnTestCompleted -= HandleTestCompleted;
                _sessionSync.OnTestAborted -= HandleTestAborted;
            }

            if (_inputHandler != null)
                _inputHandler.OnPausePressed -= HandlePausePressed;
        }

        private void HandleInstructionsComplete()
        {
            TransitionTo(TestStatus.Calibrating);
        }

        private void HandleCalibrationComplete()
        {
            TransitionTo(TestStatus.Running);
        }

        private void HandleTestCompleted(TestResults results, QualityMetrics quality)
        {
            if (quality.IsReliable)
            {
                TransitionTo(TestStatus.Completed);
                if (_resultsScreen != null)
                    _resultsScreen.Show(results, quality);
            }
            else
            {
                TransitionTo(TestStatus.Invalid);
                if (_resultsScreen != null)
                    _resultsScreen.Show(results, quality);
            }
        }

        private void HandleTestAborted(string reason)
        {
            TransitionTo(TestStatus.Aborted);
        }

        private void HandlePausePressed()
        {
            TogglePause();
        }
    }
}
