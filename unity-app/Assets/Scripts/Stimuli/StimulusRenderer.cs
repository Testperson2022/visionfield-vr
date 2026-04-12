using System;
using System.Collections;
using UnityEngine;
using VisionField.Core;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — Stimulus Renderer
///
/// Rendrer Goldmann III stimuli på en sfærisk projektion i VR.
/// Håndterer korrekt dB → luminans konvertering og præcis 200ms timing.
///
/// KLINISK KRITISK:
/// - Stimulusvarighed er ALTID 200ms ±5ms (hardcoded, aldrig framerate-afhængig)
/// - Luminans styres via kalibrerings-gamma-tabel
/// - Timing valideres runtime via StimulusTimingValidator
/// </summary>
namespace VisionField.Stimuli
{
    public class StimulusRenderer : MonoBehaviour
    {
        [Header("Stimulus Object")]
        [SerializeField] private GameObject _stimulusObject;
        [SerializeField] private MeshRenderer _stimulusRenderer;

        [Header("Background")]
        [SerializeField] private MeshRenderer _backgroundSphere;

        [Header("Fixation Point")]
        [SerializeField] private GameObject _fixationPoint;

        [Header("Kalibrering")]
        [Tooltip("Maximum stimulus luminans fra kalibreringssession (cd/m²)")]
        [SerializeField] private float _maxStimulusLuminanceCdm2 = ClinicalConstants.MAX_STIMULUS_LUMINANCE_CDM2;

        [Tooltip("Gamma correction table fra kalibreringssession (256 værdier)")]
        [SerializeField] private float[] _gammaCorrectionTable;

        [Header("Projektion")]
        [Tooltip("Radius af sfærisk projektion i meter")]
        [SerializeField] private float _projectionRadiusM = 1.0f;

        private Material _stimulusMaterial;
        private Material _backgroundMaterial;
        private StimulusTimingValidator _timingValidator;

        // State
        private bool _isStimulusActive;
        private Coroutine _activeCoroutine;

        public bool IsStimulusActive => _isStimulusActive;

        /// <summary>Event fired when stimulus presentation is complete.</summary>
        public event Action<float> OnStimulusComplete; // actual duration in ms

        private void Awake()
        {
            _timingValidator = new StimulusTimingValidator();

            if (_stimulusRenderer != null)
                _stimulusMaterial = _stimulusRenderer.material;
            if (_backgroundSphere != null)
                _backgroundMaterial = _backgroundSphere.material;

            if (_stimulusObject != null)
                _stimulusObject.SetActive(false);
        }

        /// <summary>
        /// Præsentér en stimulus på den angivne position med den angivne intensitet.
        /// Stimulus vises i præcis 200ms (±5ms) og slukkes automatisk.
        /// </summary>
        /// <param name="request">Stimulus-parametre fra ZestTestRunner</param>
        public void PresentStimulus(StimulusRequest request)
        {
            if (_isStimulusActive)
            {
                Debug.LogWarning("[StimulusRenderer] Stimulus allerede aktiv — ignorerer ny præsentation");
                return;
            }

            // Beregn VR-position fra visuelle grader
            Vector3 position = DegreesToWorldPosition(request.XDeg, request.YDeg);

            // Sæt stimulus størrelse (Goldmann III = 0.43° diameter)
            float sizeM = DegreesToMeters(ClinicalConstants.STIMULUS_DIAMETER_DEG);

            // Beregn luminans fra dB
            float luminanceFactor = DbToLuminanceFactor(request.IntensityDb);

            _activeCoroutine = StartCoroutine(PresentStimulusCoroutine(position, sizeM, luminanceFactor));
        }

        /// <summary>Stop eventuel aktiv stimulus øjeblikkeligt.</summary>
        public void CancelStimulus()
        {
            if (_activeCoroutine != null)
            {
                StopCoroutine(_activeCoroutine);
                _activeCoroutine = null;
            }
            HideStimulus();
        }

        // ─── Coroutine: præcis 200ms timing ─────────────────────────────

        private IEnumerator PresentStimulusCoroutine(Vector3 position, float sizeM, float luminanceFactor)
        {
            _isStimulusActive = true;

            // Placér og vis stimulus
            ShowStimulus(position, sizeM, luminanceFactor);

            // KRITISK: Brug realtimeSinceStartup — uafhængig af Time.timeScale og framerate
            // Ref: lessons.md — stimulus duration er hardcoded konstant, aldrig framerate-baseret
            float startTime = Time.realtimeSinceStartup;
            float targetDuration = ClinicalConstants.STIMULUS_DURATION_MS / 1000f;

            _timingValidator.MarkStimulusStart();

            // Vent præcis 200ms
            while (Time.realtimeSinceStartup - startTime < targetDuration)
            {
                yield return null;
            }

            // Sluk stimulus
            HideStimulus();
            _isStimulusActive = false;
            _activeCoroutine = null;

            float actualDurationMs = _timingValidator.MarkStimulusEnd();
            OnStimulusComplete?.Invoke(actualDurationMs);
        }

        private void ShowStimulus(Vector3 position, float sizeM, float luminanceFactor)
        {
            if (_stimulusObject == null) return;

            _stimulusObject.transform.localPosition = position;
            _stimulusObject.transform.localScale = Vector3.one * sizeM;

            if (_stimulusMaterial != null)
            {
                // Luminans via emission (HDR) — gamma-korrigeret
                float correctedLuminance = ApplyGammaCorrection(luminanceFactor);
                Color emissionColor = Color.white * correctedLuminance;
                _stimulusMaterial.SetColor("_EmissionColor", emissionColor);
                _stimulusMaterial.EnableKeyword("_EMISSION");
            }

            _stimulusObject.SetActive(true);
        }

        private void HideStimulus()
        {
            if (_stimulusObject != null)
                _stimulusObject.SetActive(false);
        }

        // ─── Konverteringsfunktioner ─────────────────────────────────────

        /// <summary>
        /// Konvertér dB-intensitet til luminans-faktor (0-1).
        /// dB-skala: 0 dB = max luminans, 51 dB = min luminans.
        /// Formel: luminance = max_luminance * 10^(-dB/10)
        /// </summary>
        public static float DbToLuminanceFactor(float db)
        {
            // Clamp til valid range
            db = Mathf.Clamp(db, ClinicalConstants.DB_MIN, ClinicalConstants.DB_MAX);
            return Mathf.Pow(10f, -db / 10f);
        }

        /// <summary>
        /// Konvertér luminans-faktor til dB.
        /// Invers af DbToLuminanceFactor.
        /// </summary>
        public static float LuminanceFactorToDb(float factor)
        {
            if (factor <= 0f) return ClinicalConstants.DB_MAX;
            return -10f * Mathf.Log10(factor);
        }

        /// <summary>
        /// Konvertér visuelle grader til VR-verdensposition på sfærisk projektion.
        /// x positiv = temporal (højre for OD, venstre for OS)
        /// y positiv = superior (op)
        /// </summary>
        public Vector3 DegreesToWorldPosition(float xDeg, float yDeg)
        {
            float xRad = xDeg * Mathf.Deg2Rad;
            float yRad = yDeg * Mathf.Deg2Rad;

            // Sfærisk projektion: punkt på kugle foran patienten
            float x = _projectionRadiusM * Mathf.Tan(xRad);
            float y = _projectionRadiusM * Mathf.Tan(yRad);
            float z = _projectionRadiusM;

            return new Vector3(x, y, z);
        }

        /// <summary>Konvertér vinkeldiameter i grader til meter ved projektionsafstand.</summary>
        public float DegreesToMeters(float degrees)
        {
            return 2f * _projectionRadiusM * Mathf.Tan(degrees * Mathf.Deg2Rad / 2f);
        }

        /// <summary>Anvend gamma-korrektion fra kalibreringssession.</summary>
        private float ApplyGammaCorrection(float luminanceFactor)
        {
            if (_gammaCorrectionTable == null || _gammaCorrectionTable.Length != 256)
                return luminanceFactor;

            int index = Mathf.Clamp(Mathf.RoundToInt(luminanceFactor * 255f), 0, 255);
            return _gammaCorrectionTable[index];
        }

        /// <summary>Sæt kalibrerings-gamma-tabel runtime.</summary>
        public void SetGammaCorrectionTable(float[] gammaTable)
        {
            if (gammaTable == null || gammaTable.Length != 256)
                throw new ArgumentException("Gamma-tabel skal have præcis 256 værdier");
            _gammaCorrectionTable = gammaTable;
        }

        /// <summary>Sæt max stimulus luminans fra kalibreringssession.</summary>
        public void SetMaxStimulusLuminance(float cdm2)
        {
            _maxStimulusLuminanceCdm2 = cdm2;
        }
    }
}
