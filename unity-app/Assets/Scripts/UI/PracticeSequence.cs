using System.Collections;
using UnityEngine;
using VisionField.Core;
using VisionField.Stimuli;

/// <summary>
/// Practice Stimuli — 3 høj-intensitet stimuli før test
///
/// Viser 3 tydelige lysglimt for at træne patienten i at svare.
/// Placeret ved (0°, 0°), (15°, 0°), (-15°, 0°).
///
/// Ref: Walsh 2010 / Clinical Protocol — "3 practice stimuli"
/// </summary>
namespace VisionField.UI
{
    public class PracticeSequence : MonoBehaviour
    {
        [SerializeField] private StimulusRenderer _stimulusRenderer;

        private bool _isRunning;
        private int _practiceCount;
        private int _responsesReceived;

        public bool IsComplete { get; private set; }
        public int ResponsesReceived => _responsesReceived;

        // Practice stimulus positioner (tydelige, centrale)
        private static readonly Vector2[] PRACTICE_POSITIONS = new Vector2[]
        {
            new Vector2(0f, 0f),      // Center
            new Vector2(15f, 0f),     // Temporal
            new Vector2(-15f, 0f),    // Nasal
        };

        /// <summary>Start practice-sekvensen.</summary>
        public void StartPractice()
        {
            _isRunning = true;
            _practiceCount = 0;
            _responsesReceived = 0;
            IsComplete = false;
            StartCoroutine(PracticeCoroutine());
        }

        /// <summary>Registrer patient-respons under practice.</summary>
        public void RecordResponse()
        {
            if (_isRunning) _responsesReceived++;
        }

        private IEnumerator PracticeCoroutine()
        {
            Debug.Log("[Practice] Starter 3 øvelsesstimuli...");

            for (int i = 0; i < PRACTICE_POSITIONS.Length; i++)
            {
                // Vent ISI
                yield return new WaitForSeconds(1.5f);

                // Vis høj-intensitet stimulus (5 dB = meget lys)
                var request = new StimulusRequest
                {
                    GridPointId = -2, // Special ID for practice
                    IntensityDb = 5f, // Meget lys — patienten SKAL se den
                    XDeg = PRACTICE_POSITIONS[i].x,
                    YDeg = PRACTICE_POSITIONS[i].y,
                    CatchTrialType = Models.CatchTrialType.None
                };

                if (_stimulusRenderer != null)
                    _stimulusRenderer.PresentStimulus(request);

                _practiceCount++;
                Debug.Log($"[Practice] Stimulus {_practiceCount}/3 ved ({PRACTICE_POSITIONS[i].x}°, {PRACTICE_POSITIONS[i].y}°)");

                // Vent på respons (max 2 sekunder)
                yield return new WaitForSeconds(2f);
            }

            _isRunning = false;
            IsComplete = true;
            Debug.Log($"[Practice] Færdig — {_responsesReceived}/3 svar");
        }
    }
}
