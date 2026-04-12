using System;
using System.Collections.Generic;
using VisionField.Core.Data;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — ZEST Test Runner
///
/// Orkesterer en fuld synsfeltstest over alle 54 punkter i 24-2 gitteret.
/// Håndterer punkt-valg, catch trials, kvalitetskontrol og triage.
///
/// Pure C# (ingen MonoBehaviour) — testbar i EditMode.
/// Stimulus-rendering og eye tracking styres af separate komponenter.
/// </summary>
namespace VisionField.Core
{
    public class ZestTestRunner
    {
        private readonly Eye _eye;
        private readonly ZestConfig _config;
        private readonly GridPoint[] _gridPoints;
        private readonly Dictionary<int, ZestPoint> _zestPoints;
        private readonly System.Random _rng;

        // Catch trial tracking
        private int _totalStimuliPresented;
        private int _falsePositiveTrials;
        private int _falsePositiveResponses;
        private int _falseNegativeTrials;
        private int _falseNegativeResponses;
        private int _fixationLosses;
        private int _fixationChecks;

        // Catch trial scheduling
        private readonly int _catchTrialFrequencyPer10;
        private int _stimuliSinceLastCatchTrial;

        public bool IsComplete { get; private set; }

        public ZestTestRunner(Eye eye, int catchTrialFrequencyPer10 = 1, int? seed = null)
            : this(eye, ZestConfig.Default, catchTrialFrequencyPer10, seed) { }

        /// <param name="eye">Hvilket øje der testes</param>
        /// <param name="config">ZEST-konfiguration</param>
        /// <param name="catchTrialFrequencyPer10">Antal catch trials per 10 stimuli</param>
        /// <param name="seed">RNG seed (brug session-ID for reproducerbarhed)</param>
        public ZestTestRunner(Eye eye, ZestConfig config, int catchTrialFrequencyPer10 = 1, int? seed = null)
        {
            _eye = eye;
            _config = config;
            _gridPoints = TestGrid24_2.Grid;
            _catchTrialFrequencyPer10 = catchTrialFrequencyPer10;

            // Ref: lessons.md — catch trial timing randomiseres via session-seed
            _rng = seed.HasValue ? new System.Random(seed.Value) : new System.Random();

            // Initialiser ZEST for alle ikke-blind-spot punkter
            _zestPoints = new Dictionary<int, ZestPoint>();
            for (int i = 0; i < _gridPoints.Length; i++)
            {
                if (!_gridPoints[i].IsBlindSpot)
                {
                    _zestPoints[_gridPoints[i].Id] = new ZestPoint(_gridPoints[i], config);
                }
            }
        }

        /// <summary>
        /// Bestem næste stimulus: enten catch trial eller ZEST-punkt.
        /// Returnerer null hvis alle punkter er konvergerede.
        /// </summary>
        public StimulusRequest GetNextStimulus()
        {
            if (IsComplete)
                return null;

            // Check om alle ZEST-punkter er konvergerede
            var unconverged = GetUnconvergedPointIds();
            if (unconverged.Count == 0)
            {
                IsComplete = true;
                return null;
            }

            _totalStimuliPresented++;

            // Bestem om dette skal være en catch trial
            // Ref: lessons.md — catch trials må IKKE placeres forudsigeligt
            _stimuliSinceLastCatchTrial++;
            bool shouldCatchTrial = ShouldInsertCatchTrial();

            if (shouldCatchTrial)
            {
                _stimuliSinceLastCatchTrial = 0;
                return CreateCatchTrial(unconverged);
            }

            // Vælg tilfældigt punkt fra ikke-konvergerede
            int pointId = unconverged[_rng.Next(unconverged.Count)];
            var zest = _zestPoints[pointId];
            double intensityDb = zest.GetNextStimulusDb();

            // Clamp til valid range
            intensityDb = Math.Max(_config.DbMin, Math.Min(_config.DbMax, intensityDb));

            var gridPoint = FindGridPoint(pointId);
            return new StimulusRequest
            {
                GridPointId = pointId,
                IntensityDb = (float)intensityDb,
                XDeg = gridPoint.XDeg,
                YDeg = gridPoint.YDeg,
                CatchTrialType = CatchTrialType.None
            };
        }

        /// <summary>
        /// Registrer respons på en stimulus.
        /// </summary>
        /// <param name="gridPointId">Punkt-ID</param>
        /// <param name="seen">Om patienten responderede</param>
        /// <param name="stimulusDb">Præsenteret intensitet</param>
        /// <param name="fixationOk">Om fiksationen var stabil</param>
        /// <param name="catchTrialType">Type catch trial (None for normal stimulus)</param>
        public void RecordResponse(int gridPointId, bool seen, float stimulusDb,
            bool fixationOk, CatchTrialType catchTrialType)
        {
            // Track fixation
            _fixationChecks++;
            if (!fixationOk)
                _fixationLosses++;

            // Håndter catch trials
            if (catchTrialType == CatchTrialType.FalsePositive)
            {
                _falsePositiveTrials++;
                if (seen) _falsePositiveResponses++;
                return; // Catch trials opdaterer IKKE ZEST-posterior
            }

            if (catchTrialType == CatchTrialType.FalseNegative)
            {
                _falseNegativeTrials++;
                if (!seen) _falseNegativeResponses++;
                return; // Catch trials opdaterer IKKE ZEST-posterior
            }

            // Normal stimulus — opdater ZEST
            if (_zestPoints.TryGetValue(gridPointId, out var zest) && !zest.IsConverged)
            {
                zest.UpdateWithResponse(stimulusDb, seen);
            }
        }

        /// <summary>
        /// Beregn endelige testresultater.
        /// Kaldes når IsComplete == true.
        /// </summary>
        public TestResults ComputeResults()
        {
            var pointResults = new List<PointResult>();

            foreach (var kvp in _zestPoints)
            {
                int pointId = kvp.Key;
                var zest = kvp.Value;
                var gridPoint = FindGridPoint(pointId);
                pointResults.Add(zest.GetResult(gridPoint.NormativeThresholdDb));
            }

            // Mean Deviation (MD)
            float mdSum = 0f;
            for (int i = 0; i < pointResults.Count; i++)
                mdSum += pointResults[i].TotalDeviationDb;
            float md = mdSum / pointResults.Count;

            // Pattern Deviation: korrigér for generelt tab
            // PD = TD - MD (7th percentile correction i fuld implementation)
            var correctedResults = new PointResult[pointResults.Count];
            for (int i = 0; i < pointResults.Count; i++)
            {
                correctedResults[i] = pointResults[i];
                correctedResults[i].PatternDeviationDb = pointResults[i].TotalDeviationDb - md;
            }

            // Pattern Standard Deviation (PSD)
            float psdSum = 0f;
            for (int i = 0; i < correctedResults.Length; i++)
                psdSum += correctedResults[i].PatternDeviationDb * correctedResults[i].PatternDeviationDb;
            float psd = (float)Math.Sqrt(psdSum / correctedResults.Length);

            // Triage-klassifikation
            var triage = ClassifyTriage(md, psd);

            return new TestResults
            {
                PointResults = correctedResults,
                MeanDeviationDb = md,
                MeanDeviationPValue = 0f, // Kræver normativ p-value tabel — implementeres separat
                PatternSdDb = psd,
                PatternSdPValue = 0f,
                GHT = GHTResult.WithinNormalLimits, // Kræver hemifield-sammenligning — implementeres separat
                TriageClassification = triage.Classification,
                TriageRecommendation = triage.Recommendation
            };
        }

        /// <summary>Beregn kvalitetsmetrics for testsessionen.</summary>
        public QualityMetrics ComputeQualityMetrics(float testDurationSeconds)
        {
            float fpRate = _falsePositiveTrials > 0
                ? (float)_falsePositiveResponses / _falsePositiveTrials
                : 0f;
            float fnRate = _falseNegativeTrials > 0
                ? (float)_falseNegativeResponses / _falseNegativeTrials
                : 0f;
            float fixLossRate = _fixationChecks > 0
                ? (float)_fixationLosses / _fixationChecks
                : 0f;

            var issues = new List<string>();
            if (fpRate >= ClinicalConstants.MAX_FALSE_POSITIVE_RATE)
                issues.Add($"False positive rate ({fpRate:P0}) over grænse ({ClinicalConstants.MAX_FALSE_POSITIVE_RATE:P0})");
            if (fnRate >= ClinicalConstants.MAX_FALSE_NEGATIVE_RATE)
                issues.Add($"False negative rate ({fnRate:P0}) over grænse ({ClinicalConstants.MAX_FALSE_NEGATIVE_RATE:P0})");
            if (fixLossRate >= ClinicalConstants.MAX_FIXATION_LOSS_RATE)
                issues.Add($"Fixation loss rate ({fixLossRate:P0}) over grænse ({ClinicalConstants.MAX_FIXATION_LOSS_RATE:P0})");

            return new QualityMetrics
            {
                FalsePositiveRate = fpRate,
                FalseNegativeRate = fnRate,
                FixationLossRate = fixLossRate,
                TestDurationSeconds = testDurationSeconds,
                IsReliable = fpRate < ClinicalConstants.MAX_FALSE_POSITIVE_RATE
                          && fnRate < ClinicalConstants.MAX_FALSE_NEGATIVE_RATE,
                ReliabilityIssues = issues.ToArray()
            };
        }

        // ─── Triage ──────────────────────────────────────────────────────

        /// <summary>
        /// Klassificér testresultat til triagekategori.
        /// Spejler classifyTriage() i shared/algorithms/zest.ts.
        /// </summary>
        public static (TriageClassification Classification, string Recommendation) ClassifyTriage(
            float mdDb, float psdDb)
        {
            if (mdDb < ClinicalConstants.TRIAGE_ABNORMAL_MD_THRESHOLD ||
                psdDb > ClinicalConstants.TRIAGE_ABNORMAL_PSD_THRESHOLD)
            {
                return (TriageClassification.Abnormal,
                    "Unormalt synsfelt. Anbefal: Henvisning til øjenlæge inden for 4 uger.");
            }

            if (mdDb < ClinicalConstants.TRIAGE_NORMAL_MD_THRESHOLD ||
                psdDb > ClinicalConstants.TRIAGE_NORMAL_PSD_THRESHOLD)
            {
                return (TriageClassification.Borderline,
                    "Grænseværdi synsfelt. Anbefal: Fuld Humphrey-test hos øjenlæge inden for 3 måneder.");
            }

            return (TriageClassification.Normal,
                "Normalt synsfelt. Genscreening anbefalet om 12-24 måneder, eller ved symptomer.");
        }

        // ─── Private hjælpefunktioner ────────────────────────────────────

        private List<int> GetUnconvergedPointIds()
        {
            var result = new List<int>();
            foreach (var kvp in _zestPoints)
            {
                if (!kvp.Value.IsConverged)
                    result.Add(kvp.Key);
            }
            return result;
        }

        private bool ShouldInsertCatchTrial()
        {
            // Randomiseret: i gennemsnit _catchTrialFrequencyPer10 per 10 stimuli
            // Men ALDRIG forudsigeligt interval (ref: lessons.md)
            if (_stimuliSinceLastCatchTrial < 3) return false; // Minimum 3 mellem catch trials
            double probability = _catchTrialFrequencyPer10 / 10.0;
            return _rng.NextDouble() < probability;
        }

        private StimulusRequest CreateCatchTrial(List<int> unconvergedPointIds)
        {
            bool useFalsePositive = _rng.NextDouble() < 0.5;

            if (useFalsePositive)
            {
                // False positive: stimulus ved blind spot — forventer INGEN respons
                int blindSpotId = TestGrid24_2.GetBlindSpotPointId(_eye);
                var blindSpot = FindGridPoint(blindSpotId);
                // Intensitet over gennemsnitlig tærskel — patienten "burde" se den
                float intensity = 25f; // Tydelig stimulus
                return new StimulusRequest
                {
                    GridPointId = blindSpotId,
                    IntensityDb = intensity,
                    XDeg = blindSpot.XDeg,
                    YDeg = blindSpot.YDeg,
                    CatchTrialType = CatchTrialType.FalsePositive
                };
            }
            else
            {
                // False negative: stimulus OVER estimeret tærskel ved konvergeret/delvist punkt
                // Patienten "burde" se den → forventer respons
                int pointId = unconvergedPointIds[_rng.Next(unconvergedPointIds.Count)];
                var zest = _zestPoints[pointId];
                // Præsentér 10 dB over estimeret tærskel (tydeligt synlig)
                float intensity = (float)Math.Min(
                    _config.DbMax,
                    zest.EstimatedThresholdDb + 10);
                var gridPoint = FindGridPoint(pointId);
                return new StimulusRequest
                {
                    GridPointId = pointId,
                    IntensityDb = intensity,
                    XDeg = gridPoint.XDeg,
                    YDeg = gridPoint.YDeg,
                    CatchTrialType = CatchTrialType.FalseNegative
                };
            }
        }

        private GridPoint FindGridPoint(int id)
        {
            for (int i = 0; i < _gridPoints.Length; i++)
            {
                if (_gridPoints[i].Id == id)
                    return _gridPoints[i];
            }
            throw new ArgumentException($"GridPoint {id} ikke fundet i 24-2 gitter");
        }
    }

    /// <summary>
    /// Request for næste stimulus — sendes til StimulusRenderer.
    /// </summary>
    public class StimulusRequest
    {
        public int GridPointId;
        public float IntensityDb;
        public float XDeg;
        public float YDeg;
        public CatchTrialType CatchTrialType;
    }
}
