using System;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — ZEST Algoritme (per testpunkt)
/// Zippy Estimation by Sequential Testing
///
/// Implementerer bayesiansk adaptiv tærskelestimering.
/// Kilde: King-Smith et al. (1994), modificeret af Vingrys &amp; Pianta (1999)
///
/// KLINISK KRITISK: Denne klasse er kernen i produktets medicinske funktion.
/// Ændringer kræver re-validering mod normativ database.
/// Port af: shared/algorithms/zest.ts
/// </summary>
namespace VisionField.Core
{
    public class ZestPoint
    {
        private readonly int _gridPointId;
        private readonly ZestConfig _config;
        private readonly double[] _pdf;
        private readonly double[] _dbRange;
        private bool _isConverged;
        private int _numStimuli;
        private double _estimatedThresholdDb;
        private double _posteriorSdDb;

        public int GridPointId => _gridPointId;
        public bool IsConverged => _isConverged;
        public int NumStimuli => _numStimuli;
        public double EstimatedThresholdDb => _estimatedThresholdDb;
        public double PosteriorSdDb => _posteriorSdDb;

        public ZestPoint(GridPoint gridPoint) : this(gridPoint, ZestConfig.Default) { }

        public ZestPoint(GridPoint gridPoint, ZestConfig config)
        {
            _gridPointId = gridPoint.Id;
            _config = config;

            // Initialiser dB range array
            int numSteps = (int)Math.Round((config.DbMax - config.DbMin) / config.DbStep) + 1;
            _dbRange = new double[numSteps];
            for (int i = 0; i < numSteps; i++)
            {
                _dbRange[i] = config.DbMin + i * config.DbStep;
            }

            // Prior distribution: Gaussisk baseret på normative data
            _pdf = new double[numSteps];
            for (int i = 0; i < numSteps; i++)
            {
                double x = _dbRange[i];
                double z = (x - gridPoint.NormativeThresholdDb) / gridPoint.NormativeSdDb;
                _pdf[i] = Math.Exp(-0.5 * z * z);
            }
            NormalizePdf();

            _isConverged = false;
            _numStimuli = 0;
            _estimatedThresholdDb = gridPoint.NormativeThresholdDb;
            _posteriorSdDb = gridPoint.NormativeSdDb;
        }

        /// <summary>
        /// Beregn næste stimulusintensitet (posterior forventet værdi).
        /// Kaster InvalidOperationException hvis punktet allerede er konvergeret.
        /// </summary>
        public double GetNextStimulusDb()
        {
            if (_isConverged)
            {
                throw new InvalidOperationException(
                    $"Punkt {_gridPointId} er allerede konvergeret");
            }
            return _estimatedThresholdDb;
        }

        /// <summary>
        /// Opdater posterior baseret på patientens respons.
        /// </summary>
        /// <param name="stimulusDb">Præsenteret intensitet (dB)</param>
        /// <param name="seen">Om patienten svarede (trykkede på knap)</param>
        public void UpdateWithResponse(double stimulusDb, bool seen)
        {
            // Beregn likelihood for hvert muligt tærskelværdi og opdater posterior
            for (int i = 0; i < _pdf.Length; i++)
            {
                double pSeen = PsychometricFunction(stimulusDb, _dbRange[i]);
                _pdf[i] *= seen ? pSeen : (1.0 - pSeen);
            }

            NormalizePdf();
            _numStimuli++;

            // Opdater estimat og SD
            _estimatedThresholdDb = ComputeMean();
            _posteriorSdDb = ComputeSD();

            // Check konvergens: SD < stopkriterium ELLER max stimuli nået
            // KRITISK: Disse er de ENESTE stopkriterier — aldrig tilføj andre.
            if (_posteriorSdDb < _config.StopSdDb || _numStimuli >= _config.MaxStimuli)
            {
                _isConverged = true;
            }
        }

        /// <summary>
        /// Returnerer resultat for dette punkt.
        /// Kan kaldes før konvergens (for mellemresultater).
        /// </summary>
        public PointResult GetResult(float normativeThresholdDb)
        {
            return new PointResult
            {
                GridPointId = _gridPointId,
                ThresholdDb = (float)_estimatedThresholdDb,
                PosteriorSdDb = (float)_posteriorSdDb,
                TotalDeviationDb = (float)(_estimatedThresholdDb - normativeThresholdDb),
                PatternDeviationDb = 0f, // Beregnes af ZestTestRunner efter alle punkter
                NumStimuli = _numStimuli
            };
        }

        // ─── Psychometrisk funktion (Weibull) ────────────────────────────

        /// <summary>
        /// Sandsynlighed for at patienten ser stimulus ved intensitet x,
        /// givet at den sande tærskel er threshold.
        /// Weibull psychometric function med false positive/negative rater.
        /// </summary>
        private static double PsychometricFunction(double xDb, double thresholdDb)
        {
            double slope = ClinicalConstants.PSYCHOMETRIC_SLOPE;
            double fp = ClinicalConstants.PSYCHOMETRIC_FALSE_POSITIVE;
            double fn = ClinicalConstants.PSYCHOMETRIC_FALSE_NEGATIVE;

            double weibull = 1.0 - Math.Exp(
                -Math.Pow(10.0, (slope * (xDb - thresholdDb)) / 10.0));

            return fp + (1.0 - fp - fn) * weibull;
        }

        // ─── Private hjælpefunktioner ────────────────────────────────────

        private void NormalizePdf()
        {
            double sum = 0;
            for (int i = 0; i < _pdf.Length; i++)
                sum += _pdf[i];

            if (sum == 0)
            {
                // Fallback: uniform distribution (undgå division med nul)
                double uniform = 1.0 / _pdf.Length;
                for (int i = 0; i < _pdf.Length; i++)
                    _pdf[i] = uniform;
                return;
            }

            for (int i = 0; i < _pdf.Length; i++)
                _pdf[i] /= sum;
        }

        private double ComputeMean()
        {
            double mean = 0;
            for (int i = 0; i < _pdf.Length; i++)
                mean += _dbRange[i] * _pdf[i];
            return mean;
        }

        private double ComputeSD()
        {
            double mean = ComputeMean();
            double variance = 0;
            for (int i = 0; i < _pdf.Length; i++)
            {
                double diff = _dbRange[i] - mean;
                variance += _pdf[i] * diff * diff;
            }
            return Math.Sqrt(variance);
        }
    }
}
