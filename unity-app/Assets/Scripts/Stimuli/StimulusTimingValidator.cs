using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField VR — Stimulus Timing Validator
///
/// Runtime-validering af stimulustiming (200ms ±5ms).
/// Logger afvigelser og advarer ved klinisk uacceptabel timing.
///
/// KLINISK KRITISK: Hvis timing afviger > ±5ms, kan testresultater være ugyldige.
/// Ref: IEC 62304 — medicinsk software skal kunne verificere sin egen korrekthed.
/// </summary>
namespace VisionField.Stimuli
{
    public class StimulusTimingValidator
    {
        private float _stimulusStartTime;
        private int _totalStimuli;
        private int _timingViolations;
        private float _maxDeviationMs;

        /// <summary>Antal stimuli med timing-afvigelse > ±5ms</summary>
        public int TimingViolations => _timingViolations;

        /// <summary>Total antal validerede stimuli</summary>
        public int TotalStimuli => _totalStimuli;

        /// <summary>Største registrerede timing-afvigelse (ms)</summary>
        public float MaxDeviationMs => _maxDeviationMs;

        /// <summary>Markér start af stimulus-præsentation.</summary>
        public void MarkStimulusStart()
        {
            _stimulusStartTime = Time.realtimeSinceStartup;
        }

        /// <summary>
        /// Markér slut af stimulus-præsentation og validér timing.
        /// Returnerer faktisk varighed i millisekunder.
        /// </summary>
        public float MarkStimulusEnd()
        {
            float endTime = Time.realtimeSinceStartup;
            float actualDurationMs = (endTime - _stimulusStartTime) * 1000f;
            float deviationMs = actualDurationMs - ClinicalConstants.STIMULUS_DURATION_MS;

            _totalStimuli++;

            if (Mathf.Abs(deviationMs) > Mathf.Abs(_maxDeviationMs))
                _maxDeviationMs = deviationMs;

            if (Mathf.Abs(deviationMs) > ClinicalConstants.STIMULUS_TIMING_TOLERANCE_MS)
            {
                _timingViolations++;
                // Klinisk advarsel — timing uden for tolerance
                Debug.LogWarning(
                    $"[StimulusTimingValidator] Timing-afvigelse: {deviationMs:+0.0;-0.0}ms " +
                    $"(faktisk: {actualDurationMs:F1}ms, krav: {ClinicalConstants.STIMULUS_DURATION_MS}ms ±{ClinicalConstants.STIMULUS_TIMING_TOLERANCE_MS}ms). " +
                    $"Violations: {_timingViolations}/{_totalStimuli}");
            }

            return actualDurationMs;
        }

        /// <summary>Nulstil validatoren for ny testsession.</summary>
        public void Reset()
        {
            _stimulusStartTime = 0f;
            _totalStimuli = 0;
            _timingViolations = 0;
            _maxDeviationMs = 0f;
        }
    }
}
