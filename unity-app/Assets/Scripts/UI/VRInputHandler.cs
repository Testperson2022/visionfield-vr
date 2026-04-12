using System;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField VR — VR Controller Input Handler
///
/// Håndterer patient-input fra Meta Quest 3 controller:
/// - Trigger → stimulus-respons (under test)
/// - Menu-knap → pause/resume
///
/// Anti-anticipation: Ignorerer input de første 100ms efter stimulus-start
/// for at filtrere tilfældige tryk fra.
///
/// Response timing bruger Time.realtimeSinceStartup (framerate-uafhængig).
/// </summary>
namespace VisionField.UI
{
    public class VRInputHandler : MonoBehaviour
    {
        /// <summary>Minimum ms efter stimulus-onset før respons accepteres (anti-anticipation)</summary>
        private const float MIN_RESPONSE_DELAY_MS = 100f;

        /// <summary>Maximum ms efter stimulus-onset for gyldig respons</summary>
        private const float MAX_RESPONSE_WINDOW_MS = 1800f;

        // State
        private bool _isResponseWindowOpen;
        private float _stimulusOnsetTimeSec;
        private bool _responseRegistered;

        // ─── Events ──────────────────────────────────────────────────

        /// <summary>Patient trykkede respons-knap. Parameter: response_time_ms fra stimulus onset.</summary>
        public event Action<float> OnResponsePressed;

        /// <summary>Patient trykkede pause-knap.</summary>
        public event Action OnPausePressed;

        /// <summary>Patient trykkede resume/continue-knap.</summary>
        public event Action OnContinuePressed;

        /// <summary>Responsvindue udløb uden tryk.</summary>
        public event Action OnResponseTimeout;

        // ─── Public properties ───────────────────────────────────────

        public bool IsResponseWindowOpen => _isResponseWindowOpen;
        public bool HasResponded => _responseRegistered;

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>
        /// Åbn responsvindue — kald når stimulus vises.
        /// Starter timing for response_time_ms.
        /// </summary>
        public void OpenResponseWindow()
        {
            _stimulusOnsetTimeSec = Time.realtimeSinceStartup;
            _isResponseWindowOpen = true;
            _responseRegistered = false;
        }

        /// <summary>Luk responsvindue manuelt.</summary>
        public void CloseResponseWindow()
        {
            _isResponseWindowOpen = false;
        }

        // ─── Unity lifecycle ─────────────────────────────────────────

        private void Update()
        {
            // Check respons-input
            if (_isResponseWindowOpen && !_responseRegistered)
            {
                float elapsedMs = (Time.realtimeSinceStartup - _stimulusOnsetTimeSec) * 1000f;

                // Check timeout
                if (elapsedMs > MAX_RESPONSE_WINDOW_MS)
                {
                    _isResponseWindowOpen = false;
                    OnResponseTimeout?.Invoke();
                    return;
                }

                // Check trigger-input (respons)
                if (GetTriggerPressed())
                {
                    // Anti-anticipation: ignorer tryk i de første 100ms
                    if (elapsedMs < MIN_RESPONSE_DELAY_MS)
                        return;

                    _responseRegistered = true;
                    _isResponseWindowOpen = false;
                    OnResponsePressed?.Invoke(elapsedMs);
                }
            }

            // Check pause-input (altid aktiv)
            if (GetMenuButtonPressed())
            {
                OnPausePressed?.Invoke();
            }
        }

        /// <summary>
        /// Beregn response time i ms fra seneste stimulus onset.
        /// Returnerer -1 hvis ingen respons.
        /// </summary>
        public float GetResponseTimeMs()
        {
            if (!_responseRegistered) return -1f;
            return (Time.realtimeSinceStartup - _stimulusOnsetTimeSec) * 1000f;
        }

        // ─── Input stubs (erstattes med OVRInput i produktion) ───────

        /// <summary>
        /// Trigger-knap trykket dette frame.
        /// STUB: Erstat med OVRInput.GetDown(OVRInput.Button.PrimaryIndexTrigger)
        /// </summary>
        protected virtual bool GetTriggerPressed()
        {
            // Fallback til keyboard for development/testing
            return Input.GetKeyDown(KeyCode.Space);
        }

        /// <summary>
        /// Menu-knap trykket dette frame.
        /// STUB: Erstat med OVRInput.GetDown(OVRInput.Button.Start)
        /// </summary>
        protected virtual bool GetMenuButtonPressed()
        {
            return Input.GetKeyDown(KeyCode.Escape);
        }
    }
}
