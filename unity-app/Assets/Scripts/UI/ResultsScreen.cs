using System;
using UnityEngine;
using VisionField.Core;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — Resultatskærm
///
/// Viser testresultater efter afsluttet session:
/// - MD (Mean Deviation), PSD (Pattern Standard Deviation)
/// - Triage-klassifikation med farvekode
/// - Kvalitetsmetrics (FP%, FN%, fixation loss%)
/// - Pålidelighedsstatus
///
/// Ref: docs/clinical-protocol-v1.md — triage-kategorier og anbefalinger
/// </summary>
namespace VisionField.UI
{
    public class ResultsScreen : MonoBehaviour
    {
        [Header("UI References")]
        [SerializeField] private GameObject _screenRoot;
        [SerializeField] private UnityEngine.UI.Text _triageText;
        [SerializeField] private UnityEngine.UI.Text _mdText;
        [SerializeField] private UnityEngine.UI.Text _psdText;
        [SerializeField] private UnityEngine.UI.Text _qualityText;
        [SerializeField] private UnityEngine.UI.Text _reliabilityText;
        [SerializeField] private UnityEngine.UI.Image _triageColorIndicator;

        // Triage farver
        private static readonly Color TriageNormal = new Color(0.2f, 0.8f, 0.2f, 1f);     // Grøn
        private static readonly Color TriageBorderline = new Color(0.9f, 0.8f, 0.1f, 1f);  // Gul
        private static readonly Color TriageAbnormal = new Color(0.9f, 0.2f, 0.2f, 1f);    // Rød

        /// <summary>"Næste øje" eller "Afslut" knap trykket.</summary>
        public event Action OnContinuePressed;

        /// <summary>"Gentag test" knap trykket (ved ugyldig test).</summary>
        public event Action OnRetryPressed;

        // ─── Public API ──────────────────────────────────────────────

        /// <summary>Vis resultater for en afsluttet testsession.</summary>
        public void Show(TestResults results, QualityMetrics quality)
        {
            if (_screenRoot != null)
                _screenRoot.SetActive(true);

            UpdateTriageDisplay(results);
            UpdateMetricsDisplay(results);
            UpdateQualityDisplay(quality);
        }

        /// <summary>Skjul resultatskærm.</summary>
        public void Hide()
        {
            if (_screenRoot != null)
                _screenRoot.SetActive(false);
        }

        /// <summary>Kaldes af UI-knapper.</summary>
        public void HandleContinue() => OnContinuePressed?.Invoke();
        public void HandleRetry() => OnRetryPressed?.Invoke();

        // ─── Private display-opdateringer ────────────────────────────

        private void UpdateTriageDisplay(TestResults results)
        {
            if (_triageText != null)
            {
                switch (results.TriageClassification)
                {
                    case TriageClassification.Normal:
                        _triageText.text = "Normal";
                        if (_triageColorIndicator != null)
                            _triageColorIndicator.color = TriageNormal;
                        break;

                    case TriageClassification.Borderline:
                        _triageText.text = "Grænseværdi";
                        if (_triageColorIndicator != null)
                            _triageColorIndicator.color = TriageBorderline;
                        break;

                    case TriageClassification.Abnormal:
                        _triageText.text = "Unormal";
                        if (_triageColorIndicator != null)
                            _triageColorIndicator.color = TriageAbnormal;
                        break;
                }
            }
        }

        private void UpdateMetricsDisplay(TestResults results)
        {
            if (_mdText != null)
                _mdText.text = $"MD: {results.MeanDeviationDb:F1} dB";

            if (_psdText != null)
                _psdText.text = $"PSD: {results.PatternSdDb:F1} dB";
        }

        private void UpdateQualityDisplay(QualityMetrics quality)
        {
            if (_qualityText != null)
            {
                _qualityText.text =
                    $"False positives: {quality.FalsePositiveRate:P0}\n" +
                    $"False negatives: {quality.FalseNegativeRate:P0}\n" +
                    $"Fixation loss: {quality.FixationLossRate:P0}\n" +
                    $"Varighed: {quality.TestDurationSeconds:F0} sek";
            }

            if (_reliabilityText != null)
            {
                if (quality.IsReliable)
                {
                    _reliabilityText.text = "Test pålidelig";
                    _reliabilityText.color = TriageNormal;
                }
                else
                {
                    string issues = string.Join("\n", quality.ReliabilityIssues);
                    _reliabilityText.text = $"Test upålidelig\n{issues}";
                    _reliabilityText.color = TriageAbnormal;
                }
            }
        }
    }
}
