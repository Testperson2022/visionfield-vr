using System;
using System.Collections;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField VR — Eye Tracking Controller
///
/// MonoBehaviour der styrer eye tracking lifecycle:
/// 1. Warmup (500ms) — ignorerer data fra SDK i opstartsfasen
/// 2. Kalibrering (10-15s) — visuelt fiksationstarget
/// 3. Live tracking — sampler gaze hvert frame, evaluerer fiksation
///
/// KLINISK KRITISK:
/// - Ref: lessons.md [2025-01] — Eye tracking returnerer null i 2-3 frames
/// - Ref: lessons.md [2025-01] — Alle koordinater via EyeTrackingUtils.ToLocalSpace()
/// - ≥20% fixation loss → test ugyldig (clinical-protocol-v1.md)
/// </summary>
namespace VisionField.EyeTracking
{
    public class EyeTrackingController : MonoBehaviour
    {
        [Header("Configuration")]
        [SerializeField] private Transform _headTransform;
        [SerializeField] private Transform _fixationPointTransform;

        // State
        private GazeRingBuffer _gazeBuffer;
        private float _startTimeSec;
        private bool _warmupComplete;
        private bool _isCalibrated;
        private bool _isTracking;
        private float _currentDeviationDeg;
        private bool _wasFixationStable;

        // ─── Public properties ───────────────────────────────────────────

        /// <summary>Er warmup-perioden overstået? (500ms efter start)</summary>
        public bool IsWarmupComplete => _warmupComplete;

        /// <summary>Er eye tracking kalibreret og klar til brug?</summary>
        public bool IsCalibrated => _isCalibrated;

        /// <summary>Er eye tracking aktivt (warmup færdig + kalibreret)?</summary>
        public bool IsTracking => _isTracking;

        /// <summary>Er fiksationen stabil lige nu? (live status)</summary>
        public bool IsFixationStable => _currentDeviationDeg <= ClinicalConstants.FIXATION_THRESHOLD_DEG;

        /// <summary>Aktuel afvigelse fra fiksationspunkt (grader).</summary>
        public float CurrentDeviationDeg => _currentDeviationDeg;

        // ─── Events ──────────────────────────────────────────────────────

        /// <summary>Fyres når kalibrering er afsluttet.</summary>
        public event Action OnCalibrationComplete;

        /// <summary>Fyres når fiksation tabes (afvigelse > tærskel).</summary>
        public event Action<float> OnFixationLost; // deviation in degrees

        /// <summary>Fyres når fiksation genoprettes.</summary>
        public event Action OnFixationRestored;

        // ─── Lifecycle ───────────────────────────────────────────────────

        private void Awake()
        {
            _gazeBuffer = new GazeRingBuffer(30); // ~330ms ved 90Hz
            _currentDeviationDeg = float.MaxValue;
            _wasFixationStable = false;
        }

        /// <summary>Start eye tracking med warmup-delay.</summary>
        public void StartTracking()
        {
            _startTimeSec = Time.realtimeSinceStartup;
            _warmupComplete = false;
            _isCalibrated = false;
            _isTracking = false;
            _gazeBuffer.Clear();

            StartCoroutine(WarmupCoroutine());
        }

        /// <summary>Stop eye tracking og ryd buffer.</summary>
        public void StopTracking()
        {
            _isTracking = false;
            _warmupComplete = false;
            _gazeBuffer.Clear();
            StopAllCoroutines();
        }

        private void Update()
        {
            if (!_warmupComplete || !_isCalibrated)
                return;

            // Sample gaze fra eye tracking SDK
            // I produktion: erstat med OVREyeGaze API-kald
            Vector3 rawGazeWorld = GetRawGazeDirection();

            if (rawGazeWorld == Vector3.zero)
                return; // Ingen valid data dette frame

            // KRITISK: Konvertér til lokal headspace — ALDRIG brug rå koordinater
            Vector3 headPos = _headTransform != null ? _headTransform.position : Vector3.zero;
            Quaternion headRot = _headTransform != null ? _headTransform.rotation : Quaternion.identity;
            Vector3 gazeLocal = EyeTrackingUtils.ToLocalSpace(rawGazeWorld, headPos, headRot);

            // Beregn afvigelse fra fiksationspunkt
            Vector3 fixationLocal = GetFixationDirection();
            _currentDeviationDeg = EyeTrackingUtils.CalculateDeviationDeg(gazeLocal, fixationLocal);

            // Gem sample i ring buffer
            var sample = new GazeSample
            {
                TimestampSec = Time.realtimeSinceStartup,
                DirectionLocal = gazeLocal,
                DeviationDeg = _currentDeviationDeg,
                IsValid = true
            };
            _gazeBuffer.Add(sample);

            // Emit fiksations-events
            bool isStableNow = EyeTrackingUtils.IsFixationStable(_currentDeviationDeg);
            if (_wasFixationStable && !isStableNow)
            {
                OnFixationLost?.Invoke(_currentDeviationDeg);
            }
            else if (!_wasFixationStable && isStableNow)
            {
                OnFixationRestored?.Invoke();
            }
            _wasFixationStable = isStableNow;
        }

        // ─── Public API ──────────────────────────────────────────────────

        /// <summary>
        /// Evaluer fiksationsstabilitet under seneste stimulus-præsentation.
        /// Kaldes efter 200ms stimulus er vist.
        /// Bruger samples fra gaze ring buffer i stimulus-vinduet.
        /// </summary>
        public FixationResult EvaluateFixationDuringStimulus()
        {
            if (!_isTracking)
                return FixationResult.Invalid;

            return _gazeBuffer.EvaluateFixation(
                ClinicalConstants.STIMULUS_DURATION_MS,
                ClinicalConstants.FIXATION_THRESHOLD_DEG);
        }

        /// <summary>Markér kalibrering som gennemført (kaldes af kalibreringssekvens).</summary>
        public void SetCalibrated()
        {
            _isCalibrated = true;
            _isTracking = true;
            OnCalibrationComplete?.Invoke();
        }

        // ─── Warmup ──────────────────────────────────────────────────────

        /// <summary>
        /// Vent EYE_TRACKING_WARMUP_MS (500ms) før data bruges.
        /// Ref: lessons.md — API returnerer null i første 2-3 frames.
        /// </summary>
        private IEnumerator WarmupCoroutine()
        {
            float warmupSec = ClinicalConstants.EYE_TRACKING_WARMUP_MS / 1000f;
            float startTime = Time.realtimeSinceStartup;

            while (Time.realtimeSinceStartup - startTime < warmupSec)
            {
                yield return null;
            }

            _warmupComplete = true;
        }

        // ─── SDK Integration stubs ───────────────────────────────────────
        // Erstattes med Meta Eye Tracking SDK kald i produktion

        /// <summary>
        /// Hent rå gaze-retning fra eye tracking SDK.
        /// STUB: I produktion → OVREyeGaze.EyeTrackingData.Gaze
        /// </summary>
        protected virtual Vector3 GetRawGazeDirection()
        {
            // Placeholder — overrides i produktion eller mock i tests
            return Vector3.forward;
        }

        /// <summary>
        /// Hent fiksationspunktets retning i lokal headspace.
        /// Standard: lige frem (center af display).
        /// </summary>
        private Vector3 GetFixationDirection()
        {
            if (_fixationPointTransform != null && _headTransform != null)
            {
                Vector3 dir = _fixationPointTransform.position - _headTransform.position;
                float mag = (float)System.Math.Sqrt(dir.x * dir.x + dir.y * dir.y + dir.z * dir.z);
                if (mag > 1e-6f)
                    return new Vector3(dir.x / mag, dir.y / mag, dir.z / mag);
            }
            return Vector3.forward;
        }
    }
}
