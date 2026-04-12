using System;
using UnityEngine;
using VisionField.Core;
using VisionField.Core.Models;
using VisionField.EyeTracking;
using VisionField.Stimuli;

/// <summary>
/// VisionField VR — Test Session Synchronizer
///
/// Orkesterer dataflow mellem Unity-komponenter og backend via WebSocket:
/// - Modtager SESSION_START → starter test
/// - Sender STIMULUS_RESULT efter hver respons
/// - Sender FIXATION_UPDATE til klinikertablet (10Hz)
/// - Sender SESSION_COMPLETE ved afslutning
/// - Håndterer fejl og abort
///
/// SIKKERHED: Ingen patientdata sendes — kun session_id og målingsdata.
/// </summary>
namespace VisionField.Network
{
    public class TestSessionSync : MonoBehaviour
    {
        [Header("References")]
        [SerializeField] private WebSocketClient _webSocketClient;
        [SerializeField] private StimulusRenderer _stimulusRenderer;
        [SerializeField] private EyeTrackingController _eyeTrackingController;

        [Header("Fixation Update Rate")]
        [Tooltip("Sekunder mellem FIXATION_UPDATE beskeder til tablet (0.1 = 10Hz)")]
        [SerializeField] private float _fixationUpdateIntervalSec = 0.1f;

        // State
        private ZestTestRunner _testRunner;
        private string _sessionId;
        private float _testStartTimeSec;
        private float _lastFixationUpdateTime;
        private bool _isTestActive;

        // ─── Public properties ───────────────────────────────────────

        public bool IsTestActive => _isTestActive;
        public string SessionId => _sessionId;

        // ─── Events ──────────────────────────────────────────────────

        /// <summary>Testsession startet med protocol.</summary>
        public event Action<string> OnTestStarted; // session_id

        /// <summary>Testsession afsluttet.</summary>
        public event Action<TestResults, QualityMetrics> OnTestCompleted;

        /// <summary>Testsession afbrudt.</summary>
        public event Action<string> OnTestAborted; // reason

        // ─── Lifecycle ───────────────────────────────────────────────

        private void Awake()
        {
            if (_webSocketClient != null)
            {
                _webSocketClient.OnMessageReceived += HandleIncomingMessage;
                _webSocketClient.OnDisconnected += HandleDisconnected;
            }
        }

        private void Update()
        {
            if (!_isTestActive) return;

            // Send FIXATION_UPDATE til tablet med konfigureret frekvens
            if (_eyeTrackingController != null &&
                Time.realtimeSinceStartup - _lastFixationUpdateTime > _fixationUpdateIntervalSec)
            {
                SendFixationUpdate();
                _lastFixationUpdateTime = Time.realtimeSinceStartup;
            }
        }

        private void OnDestroy()
        {
            if (_webSocketClient != null)
            {
                _webSocketClient.OnMessageReceived -= HandleIncomingMessage;
                _webSocketClient.OnDisconnected -= HandleDisconnected;
            }
        }

        // ─── Indgående beskeder ──────────────────────────────────────

        private void HandleIncomingMessage(WebSocketMessage message)
        {
            switch (message.type)
            {
                case EventType.SESSION_START:
                    HandleSessionStart((SessionStartMessage)message);
                    break;

                case EventType.CALIBRATION_UPDATE:
                    HandleCalibrationUpdate((CalibrationUpdateMessage)message);
                    break;

                case EventType.SESSION_ABORT:
                    HandleSessionAbort((SessionAbortMessage)message);
                    break;

                case EventType.ERROR:
                    HandleError((ErrorMessage)message);
                    break;
            }
        }

        private void HandleSessionStart(SessionStartMessage msg)
        {
            _sessionId = msg.session_id;
            _testStartTimeSec = Time.realtimeSinceStartup;

            // Konfigurér ZEST test runner fra protocol
            var protocol = msg.protocol;
            int seed = _sessionId.GetHashCode(); // Deterministisk seed fra session
            _testRunner = new ZestTestRunner(
                Eye.OD, // Øje specificeres separat (via UI eller backend)
                catchTrialFrequencyPer10: protocol != null ? protocol.catch_trial_frequency : 1,
                seed: seed);

            _isTestActive = true;
            _lastFixationUpdateTime = Time.realtimeSinceStartup;

            OnTestStarted?.Invoke(_sessionId);
            Debug.Log($"[TestSessionSync] Session startet: {_sessionId}");
        }

        private void HandleCalibrationUpdate(CalibrationUpdateMessage msg)
        {
            if (msg.data == null) return;

            // Opdatér stimulus renderer med kalibrerings-data
            if (_stimulusRenderer != null)
            {
                if (msg.data.gamma_correction_table != null)
                    _stimulusRenderer.SetGammaCorrectionTable(msg.data.gamma_correction_table);
                _stimulusRenderer.SetMaxStimulusLuminance(msg.data.max_stimulus_luminance_cdm2);
            }
        }

        private void HandleSessionAbort(SessionAbortMessage msg)
        {
            _isTestActive = false;
            OnTestAborted?.Invoke(msg.reason);
            Debug.LogWarning($"[TestSessionSync] Session afbrudt: {msg.reason}");
        }

        private void HandleError(ErrorMessage msg)
        {
            // SIKKERHED: Log kun fejlkode, ALDRIG detaljer der kan indeholde PII
            Debug.LogWarning($"[TestSessionSync] Fejl: {msg.code} (recoverable: {msg.recoverable})");

            if (!msg.recoverable)
            {
                AbortTest("UNRECOVERABLE_ERROR");
            }
        }

        private void HandleDisconnected(string reason)
        {
            if (_isTestActive)
            {
                // Test kører stadig lokalt — WebSocket reconnect håndteres af WebSocketClient
                Debug.LogWarning("[TestSessionSync] Forbindelse tabt under aktiv test — afventer reconnect");
            }
        }

        // ─── Udgående: stimulus resultat ─────────────────────────────

        /// <summary>
        /// Registrer og send stimulus-resultat til backend.
        /// Kaldes af test-loop efter patient-respons.
        /// </summary>
        public void RecordAndSendStimulusResult(StimulusRequest request,
            bool responded, float responseTimeMs, FixationResult fixation)
        {
            if (!_isTestActive || _testRunner == null) return;

            // Registrér i ZEST test runner
            _testRunner.RecordResponse(
                request.GridPointId, responded, request.IntensityDb,
                fixation.IsStable, request.CatchTrialType);

            // Send til backend
            var msg = new StimulusResultMessage
            {
                stimulus_id = Guid.NewGuid().ToString(),
                session_id = _sessionId,
                grid_point_id = request.GridPointId,
                presented_at_ms = (long)((Time.realtimeSinceStartup - _testStartTimeSec) * 1000f),
                intensity_db = request.IntensityDb,
                x_deg = request.XDeg,
                y_deg = request.YDeg,
                is_catch_trial = request.CatchTrialType != CatchTrialType.None,
                catch_trial_type = request.CatchTrialType == CatchTrialType.None
                    ? null
                    : request.CatchTrialType == CatchTrialType.FalsePositive
                        ? "false_positive"
                        : "false_negative",
                responded = responded,
                response_time_ms = responseTimeMs,
                fixation_ok = fixation.IsStable,
                fixation_deviation_deg = fixation.MeanDeviationDeg
            };

            if (_webSocketClient != null && _webSocketClient.IsConnected)
                _webSocketClient.Send(msg);

            // Check om test er færdig
            if (_testRunner.IsComplete)
                CompleteTest();
        }

        /// <summary>Hent næste stimulus fra ZEST runner.</summary>
        public StimulusRequest GetNextStimulus()
        {
            if (_testRunner == null || _testRunner.IsComplete)
                return null;
            return _testRunner.GetNextStimulus();
        }

        // ─── Udgående: fixation update ───────────────────────────────

        private void SendFixationUpdate()
        {
            if (_eyeTrackingController == null || _webSocketClient == null) return;
            if (!_webSocketClient.IsConnected) return;

            var msg = new FixationUpdateMessage
            {
                is_ok = _eyeTrackingController.IsFixationStable,
                deviation_deg = _eyeTrackingController.CurrentDeviationDeg
            };

            _webSocketClient.Send(msg);
        }

        // ─── Test completion ─────────────────────────────────────────

        private void CompleteTest()
        {
            _isTestActive = false;
            float durationSec = Time.realtimeSinceStartup - _testStartTimeSec;

            var results = _testRunner.ComputeResults();
            var quality = _testRunner.ComputeQualityMetrics(durationSec);

            // Send SESSION_COMPLETE til backend
            var msg = new SessionCompleteMessage
            {
                results = ConvertResults(results),
                quality = ConvertQuality(quality)
            };

            if (_webSocketClient != null && _webSocketClient.IsConnected)
                _webSocketClient.Send(msg);

            OnTestCompleted?.Invoke(results, quality);
            Debug.Log($"[TestSessionSync] Test afsluttet. MD={results.MeanDeviationDb:F1}dB, " +
                      $"Triage={results.TriageClassification}, Reliable={quality.IsReliable}");
        }

        /// <summary>Afbryd test og send SESSION_ABORT.</summary>
        public void AbortTest(string reason)
        {
            _isTestActive = false;

            var msg = new SessionAbortMessage { reason = reason };
            if (_webSocketClient != null && _webSocketClient.IsConnected)
                _webSocketClient.Send(msg);

            OnTestAborted?.Invoke(reason);
        }

        // ─── Konvertering til netværksformat ─────────────────────────

        private static SessionResultsData ConvertResults(TestResults results)
        {
            var pointData = new PointResultData[results.PointResults.Length];
            for (int i = 0; i < results.PointResults.Length; i++)
            {
                var pr = results.PointResults[i];
                pointData[i] = new PointResultData
                {
                    grid_point_id = pr.GridPointId,
                    threshold_db = pr.ThresholdDb,
                    posterior_sd_db = pr.PosteriorSdDb,
                    total_deviation_db = pr.TotalDeviationDb,
                    pattern_deviation_db = pr.PatternDeviationDb,
                    num_stimuli = pr.NumStimuli
                };
            }

            return new SessionResultsData
            {
                point_results = pointData,
                mean_deviation_db = results.MeanDeviationDb,
                pattern_sd_db = results.PatternSdDb,
                ght = results.GHT.ToString(),
                triage_classification = results.TriageClassification.ToString().ToLower(),
                triage_recommendation = results.TriageRecommendation
            };
        }

        private static QualityData ConvertQuality(QualityMetrics quality)
        {
            return new QualityData
            {
                false_positive_rate = quality.FalsePositiveRate,
                false_negative_rate = quality.FalseNegativeRate,
                fixation_loss_rate = quality.FixationLossRate,
                test_duration_seconds = quality.TestDurationSeconds,
                is_reliable = quality.IsReliable,
                reliability_issues = quality.ReliabilityIssues
            };
        }
    }
}
