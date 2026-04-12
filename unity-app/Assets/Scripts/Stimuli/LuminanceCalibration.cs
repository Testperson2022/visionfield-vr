using System;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// Luminans-kalibrering Wizard
///
/// 6-punkts fotometer-kalibrering for skærm-baseret perimetri.
/// Måler luminans ved 0%, 20%, 40%, 60%, 80%, 100% brightness.
/// Fitter 2. grads polynomium: luminance = a*x² + b*x + c
///
/// Ref: Specvis — "second degree polynomial to luminance values"
/// </summary>
namespace VisionField.Stimuli
{
    [Serializable]
    public class CalibrationPoint
    {
        public float BrightnessPercent;
        public float MeasuredLuminanceCdm2;
    }

    public class LuminanceCalibration
    {
        private CalibrationPoint[] _points;
        private double _a, _b, _c; // Polynomium-koefficienter
        private bool _isCalibrated;
        private float _chiSquared;

        public bool IsCalibrated => _isCalibrated;
        public float ChiSquared => _chiSquared;
        public float MaxLuminance => _isCalibrated ? PredictLuminance(100f) : ClinicalConstants.MAX_STIMULUS_LUMINANCE_CDM2;
        public float MinLuminance => _isCalibrated ? PredictLuminance(0f) : ClinicalConstants.MIN_STIMULUS_LUMINANCE_CDM2;

        /// <summary>
        /// Kalibrer med 6 målepunkter.
        /// brightness: [0, 20, 40, 60, 80, 100] procent
        /// luminance: målt med fotometer i cd/m²
        /// </summary>
        public bool Calibrate(CalibrationPoint[] points)
        {
            if (points == null || points.Length < 3)
            {
                Debug.LogError("[Calibration] Mindst 3 målepunkter krævet");
                return false;
            }

            _points = points;

            // 2. grads polynomium fit: y = ax² + bx + c
            // Least squares fit
            int n = points.Length;
            double sx = 0, sx2 = 0, sx3 = 0, sx4 = 0;
            double sy = 0, sxy = 0, sx2y = 0;

            for (int i = 0; i < n; i++)
            {
                double x = points[i].BrightnessPercent;
                double y = points[i].MeasuredLuminanceCdm2;
                sx += x; sx2 += x * x; sx3 += x * x * x; sx4 += x * x * x * x;
                sy += y; sxy += x * y; sx2y += x * x * y;
            }

            // Solve 3x3 system via Cramer's rule
            double[,] M = { { sx4, sx3, sx2 }, { sx3, sx2, sx }, { sx2, sx, n } };
            double[] V = { sx2y, sxy, sy };

            double det = Det3(M);
            if (Math.Abs(det) < 1e-12)
            {
                Debug.LogError("[Calibration] Singular matrix — ugyldig kalibrering");
                return false;
            }

            _a = Det3Replace(M, V, 0) / det;
            _b = Det3Replace(M, V, 1) / det;
            _c = Det3Replace(M, V, 2) / det;

            // Chi-squared kvalitets-metric
            _chiSquared = 0;
            for (int i = 0; i < n; i++)
            {
                double predicted = Predict(points[i].BrightnessPercent);
                double residual = points[i].MeasuredLuminanceCdm2 - predicted;
                _chiSquared += (float)(residual * residual);
            }
            _chiSquared /= n;

            _isCalibrated = true;
            Debug.Log($"[Calibration] Kalibreret: y = {_a:F6}x² + {_b:F4}x + {_c:F2}, χ² = {_chiSquared:F4}");
            return true;
        }

        /// <summary>Forudsig luminans fra brightness-procent.</summary>
        public float PredictLuminance(float brightnessPercent)
        {
            return (float)Predict(brightnessPercent);
        }

        /// <summary>Konvertér dB til brightness-procent (invers).</summary>
        public float DbToBrightnessPercent(float db)
        {
            float targetLuminance = MaxLuminance * Mathf.Pow(10f, -db / 10f);
            // Numerisk invers af polynomium
            for (float pct = 0; pct <= 100; pct += 0.5f)
            {
                if (PredictLuminance(pct) >= targetLuminance)
                    return pct;
            }
            return 100f;
        }

        /// <summary>Generér 256-entry gamma-tabel fra kalibrering.</summary>
        public float[] GenerateGammaTable()
        {
            var table = new float[256];
            for (int i = 0; i < 256; i++)
            {
                float pct = (i / 255f) * 100f;
                table[i] = PredictLuminance(pct) / MaxLuminance;
            }
            return table;
        }

        private double Predict(double x) => _a * x * x + _b * x + _c;

        private static double Det3(double[,] m) =>
            m[0, 0] * (m[1, 1] * m[2, 2] - m[1, 2] * m[2, 1]) -
            m[0, 1] * (m[1, 0] * m[2, 2] - m[1, 2] * m[2, 0]) +
            m[0, 2] * (m[1, 0] * m[2, 1] - m[1, 1] * m[2, 0]);

        private static double Det3Replace(double[,] m, double[] v, int col)
        {
            var r = (double[,])m.Clone();
            for (int i = 0; i < 3; i++) r[i, col] = v[i];
            return Det3(r);
        }
    }
}
