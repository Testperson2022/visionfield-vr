using System;
using System.Collections;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField Desktop — 2D Stimulus Renderer
///
/// Rendrer Goldmann III stimuli som hvide cirkler på sort baggrund
/// for PC/skærm-brug uden VR-headset.
///
/// Kræver: Camera med orthografisk projektion rettet mod en Canvas.
/// Stimulus placeres som UI-element baseret på visuel vinkel.
///
/// KLINISK NOTE: PC-versionen er mindre præcis end VR pga:
/// - Ukendt skærmafstand (antager 50cm)
/// - Ingen eye tracking (fiksation antages)
/// - Ukalibreret luminans
/// Egnet til screening, IKKE diagnostisk brug.
/// </summary>
namespace VisionField.Stimuli
{
    public class DesktopStimulusRenderer : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private RectTransform _stimulusRect;
        [SerializeField] private UnityEngine.UI.Image _stimulusImage;
        [SerializeField] private RectTransform _fixationRect;
        [SerializeField] private Canvas _testCanvas;

        [Header("Konfiguration")]
        [Tooltip("Antaget afstand fra skærm i cm")]
        [SerializeField] private float _screenDistanceCm = 50f;

        [Tooltip("Skærmens fysiske bredde i cm (mål din skærm)")]
        [SerializeField] private float _screenWidthCm = 53f; // 24" monitor typisk

        private bool _isStimulusActive;
        private Coroutine _activeCoroutine;
        private StimulusTimingValidator _timingValidator;

        public bool IsStimulusActive => _isStimulusActive;
        public event Action<float> OnStimulusComplete;

        private void Awake()
        {
            _timingValidator = new StimulusTimingValidator();
            if (_stimulusRect != null)
                _stimulusRect.gameObject.SetActive(false);
        }

        /// <summary>Præsentér stimulus på 2D-skærm.</summary>
        public void PresentStimulus(StimulusRequest request)
        {
            if (_isStimulusActive) return;

            // Konvertér visuel vinkel til pixel-position
            Vector2 screenPos = DegreesToScreenPosition(request.XDeg, request.YDeg);
            float sizePx = DegreesToPixels(ClinicalConstants.STIMULUS_DIAMETER_DEG);

            _activeCoroutine = StartCoroutine(PresentCoroutine(screenPos, sizePx));
        }

        public void CancelStimulus()
        {
            if (_activeCoroutine != null)
            {
                StopCoroutine(_activeCoroutine);
                _activeCoroutine = null;
            }
            HideStimulus();
        }

        private IEnumerator PresentCoroutine(Vector2 position, float sizePx)
        {
            _isStimulusActive = true;

            // Placér og vis stimulus
            if (_stimulusRect != null)
            {
                _stimulusRect.anchoredPosition = position;
                // Minimum 20px for synlighed på skærm
                float displaySize = Mathf.Max(sizePx, 20f);
                _stimulusRect.sizeDelta = new Vector2(displaySize, displaySize);
                _stimulusRect.gameObject.SetActive(true);
            }

            if (_stimulusImage != null)
                _stimulusImage.color = Color.white;

            _timingValidator.MarkStimulusStart();

            // KRITISK: 200ms ±5ms — identisk med VR-version
            float startTime = Time.realtimeSinceStartup;
            float targetDuration = ClinicalConstants.STIMULUS_DURATION_MS / 1000f;
            while (Time.realtimeSinceStartup - startTime < targetDuration)
                yield return null;

            HideStimulus();
            _isStimulusActive = false;
            _activeCoroutine = null;

            float actualMs = _timingValidator.MarkStimulusEnd();
            OnStimulusComplete?.Invoke(actualMs);
        }

        private void HideStimulus()
        {
            if (_stimulusRect != null)
                _stimulusRect.gameObject.SetActive(false);
        }

        /// <summary>
        /// Konvertér visuel vinkel (grader) til pixel-position på skærm.
        /// Skalerer 24-2 gitter til at fylde 80% af skærmbredden.
        /// Max vinkel er 27° → 27° = 40% af skærmbredde fra center.
        /// </summary>
        public Vector2 DegreesToScreenPosition(float xDeg, float yDeg)
        {
            float canvasWidth = _testCanvas != null
                ? ((RectTransform)_testCanvas.transform).rect.width
                : 1920f;
            float canvasHeight = _testCanvas != null
                ? ((RectTransform)_testCanvas.transform).rect.height
                : 1080f;

            // 27° = 40% af halv skærmbredde
            float scale = (canvasWidth * 0.4f) / 27f;
            return new Vector2(xDeg * scale, yDeg * scale);
        }

        /// <summary>Konvertér vinkel-diameter til pixels.</summary>
        public float DegreesToPixels(float degrees)
        {
            float canvasWidth = _testCanvas != null
                ? ((RectTransform)_testCanvas.transform).rect.width
                : 1920f;
            float scale = (canvasWidth * 0.4f) / 27f;
            return degrees * scale;
        }
    }
}
