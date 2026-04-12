using UnityEngine;
using VisionField.Core;
using VisionField.EyeTracking;

/// <summary>
/// VisionField VR — Test Heads-Up Display
///
/// Viser live status under testkørsel:
/// - Fiksationsstatus (grøn/gul/rød cirkel)
/// - Fremskridt (testede punkter / total)
/// - Forløbet tid (MM:SS)
///
/// Minimal UI for at undgå at distrahere patienten.
/// Ref: IEC 62366-1 — medicinsk usability krav.
/// </summary>
namespace VisionField.UI
{
    public class TestHUD : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _hudRoot;
        [SerializeField] private UnityEngine.UI.Text _progressText;
        [SerializeField] private UnityEngine.UI.Text _timeText;
        [SerializeField] private UnityEngine.UI.Image _fixationIndicator;

        [Header("Dependencies")]
        [SerializeField] private EyeTrackingController _eyeTrackingController;

        // Fixation indicator farver
        private static readonly Color FixationGood = new Color(0.2f, 0.8f, 0.2f, 1f);    // Grøn
        private static readonly Color FixationMarginal = new Color(0.9f, 0.8f, 0.1f, 1f); // Gul
        private static readonly Color FixationLost = new Color(0.9f, 0.2f, 0.2f, 1f);     // Rød

        // State
        private int _completedPoints;
        private int _totalPoints = 52; // 54 - 2 blind spots
        private float _testStartTimeSec;
        private bool _isActive;

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>Vis HUD og start tidstæller.</summary>
        public void Show(int totalTestPoints = 52)
        {
            _totalPoints = totalTestPoints;
            _completedPoints = 0;
            _testStartTimeSec = Time.realtimeSinceStartup;
            _isActive = true;

            if (_hudRoot != null)
                _hudRoot.SetActive(true);

            UpdateProgress();
            UpdateTime();
        }

        /// <summary>Skjul HUD.</summary>
        public void Hide()
        {
            _isActive = false;
            if (_hudRoot != null)
                _hudRoot.SetActive(false);
        }

        /// <summary>Opdatér antal færdige punkter.</summary>
        public void SetCompletedPoints(int count)
        {
            _completedPoints = count;
            UpdateProgress();
        }

        /// <summary>Inkrementér færdige punkter med 1.</summary>
        public void IncrementCompletedPoints()
        {
            _completedPoints++;
            UpdateProgress();
        }

        // ─── Unity lifecycle ─────────────────────────────────────────

        private void Update()
        {
            if (!_isActive) return;

            UpdateTime();
            UpdateFixationIndicator();
        }

        // ─── Private opdateringer ────────────────────────────────────

        private void UpdateProgress()
        {
            if (_progressText != null)
                _progressText.text = $"{_completedPoints} / {_totalPoints}";
        }

        private void UpdateTime()
        {
            if (_timeText == null) return;

            float elapsedSec = Time.realtimeSinceStartup - _testStartTimeSec;
            int minutes = (int)(elapsedSec / 60f);
            int seconds = (int)(elapsedSec % 60f);
            _timeText.text = $"{minutes:D2}:{seconds:D2}";
        }

        private void UpdateFixationIndicator()
        {
            if (_fixationIndicator == null || _eyeTrackingController == null)
                return;

            float deviation = _eyeTrackingController.CurrentDeviationDeg;

            if (deviation <= ClinicalConstants.FIXATION_THRESHOLD_DEG)
            {
                _fixationIndicator.color = FixationGood;
            }
            else if (deviation <= ClinicalConstants.FIXATION_THRESHOLD_DEG * 1.5f)
            {
                _fixationIndicator.color = FixationMarginal;
            }
            else
            {
                _fixationIndicator.color = FixationLost;
            }
        }
    }
}
