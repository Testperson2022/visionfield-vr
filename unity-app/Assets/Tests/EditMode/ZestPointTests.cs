using System;
using NUnit.Framework;
using VisionField.Core;
using VisionField.Core.Models;

/// <summary>
/// EditMode tests for ZestPoint.
/// Spejler shared/algorithms/zest.test.ts — sikrer paritet med TypeScript-referencen.
///
/// KLINISK KRITISK: Disse tests verificerer korrekt tærskelestimering.
/// Fejl her kan betyde forkert diagnose.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class ZestPointTests
    {
        private GridPoint _normalPoint;
        private GridPoint _peripheralPoint;

        [SetUp]
        public void SetUp()
        {
            // Centralt punkt med typisk normativ tærskel
            _normalPoint = new GridPoint(
                id: 4, xDeg: -3f, yDeg: 3f, isBlindSpot: false,
                normativeThresholdDb: 30.5f, normativeSdDb: 2.0f);

            // Perifert punkt med lavere normativ tærskel og højere SD
            _peripheralPoint = new GridPoint(
                id: 0, xDeg: -27f, yDeg: 3f, isBlindSpot: false,
                normativeThresholdDb: 24.0f, normativeSdDb: 3.2f);
        }

        // ─── Initialisering ─────────────────────────────────────────────

        [Test]
        public void Constructor_InitializesWithNormativePrior()
        {
            var zest = new ZestPoint(_normalPoint);

            Assert.IsFalse(zest.IsConverged);
            Assert.AreEqual(0, zest.NumStimuli);
            // Initialt estimat = normativ tærskel
            Assert.AreEqual(30.5, zest.EstimatedThresholdDb, 0.5);
        }

        [Test]
        public void Constructor_PeripheralPoint_HigherInitialSD()
        {
            var zest = new ZestPoint(_peripheralPoint);

            Assert.AreEqual(24.0, zest.EstimatedThresholdDb, 0.5);
            Assert.IsFalse(zest.IsConverged);
        }

        // ─── Konvergens: normal vision ───────────────────────────────────

        [Test]
        public void Convergence_NormalVision_ConvergesToNormativeThreshold()
        {
            var zest = new ZestPoint(_normalPoint);
            float trueThreshold = 30.5f; // Normal syn

            // Simulér patient der ser alt over tærskel, intet under
            int maxIterations = 50;
            for (int i = 0; i < maxIterations && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                bool seen = stimulus >= trueThreshold;
                zest.UpdateWithResponse(stimulus, seen);
            }

            Assert.IsTrue(zest.IsConverged, "Burde konvergere inden for 50 stimuli");
            // Estimat bør være tæt på sand tærskel
            Assert.AreEqual(trueThreshold, zest.EstimatedThresholdDb, 3.0,
                $"Estimeret tærskel ({zest.EstimatedThresholdDb:F1} dB) afviger for meget fra sand ({trueThreshold} dB)");
        }

        [Test]
        public void Convergence_NormalVision_ConvergesInReasonableStimuli()
        {
            var zest = new ZestPoint(_normalPoint);
            float trueThreshold = 30.5f;

            int stimuliUsed = 0;
            while (!zest.IsConverged)
            {
                double stimulus = zest.GetNextStimulusDb();
                bool seen = stimulus >= trueThreshold;
                zest.UpdateWithResponse(stimulus, seen);
                stimuliUsed++;
            }

            // Normal vision bør konvergere relativt hurtigt
            Assert.Less(stimuliUsed, 25,
                "Normal vision bør konvergere inden for 25 stimuli");
        }

        // ─── Konvergens: absolut skotom ──────────────────────────────────

        [Test]
        public void Convergence_AbsoluteScotoma_ConvergesToZero()
        {
            var zest = new ZestPoint(_normalPoint);

            // Absolut skotom: patienten ser aldrig stimulus
            for (int i = 0; i < 50 && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                zest.UpdateWithResponse(stimulus, false);
            }

            Assert.IsTrue(zest.IsConverged);
            // Tærskel bør være tæt på 0 dB (eller meget lav)
            Assert.Less(zest.EstimatedThresholdDb, 5.0,
                $"Skotom-tærskel ({zest.EstimatedThresholdDb:F1} dB) burde være tæt på 0");
        }

        // ─── Max stimuli grænse ──────────────────────────────────────────

        [Test]
        public void MaxStimuli_ForcesConvergenceAt50()
        {
            // Brug højt SD punkt og inkonsistente svar for at forhindre normal konvergens
            var zest = new ZestPoint(_peripheralPoint);
            var rng = new System.Random(42);

            for (int i = 0; i < 50; i++)
            {
                if (zest.IsConverged) break;
                double stimulus = zest.GetNextStimulusDb();
                // Tilfældige svar — gør konvergens svær
                zest.UpdateWithResponse(stimulus, rng.NextDouble() > 0.5);
            }

            Assert.IsTrue(zest.IsConverged,
                "Skal konvergere efter max 50 stimuli, uanset svar-mønster");
            Assert.LessOrEqual(zest.NumStimuli, 50);
        }

        // ─── Fejlhåndtering ─────────────────────────────────────────────

        [Test]
        public void GetNextStimulusDb_ThrowsAfterConvergence()
        {
            var zest = new ZestPoint(_normalPoint);

            // Forcér hurtig konvergens
            for (int i = 0; i < 50 && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                zest.UpdateWithResponse(stimulus, stimulus >= 30.5);
            }

            Assert.IsTrue(zest.IsConverged);
            Assert.Throws<InvalidOperationException>(() => zest.GetNextStimulusDb());
        }

        // ─── Stimulus range ──────────────────────────────────────────────

        [Test]
        public void GetNextStimulusDb_ReturnsValueInValidRange()
        {
            var zest = new ZestPoint(_normalPoint);

            for (int i = 0; i < 20 && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                Assert.GreaterOrEqual(stimulus, ClinicalConstants.DB_MIN,
                    "Stimulus under minimum dB range");
                Assert.LessOrEqual(stimulus, ClinicalConstants.DB_MAX,
                    "Stimulus over maximum dB range");
                zest.UpdateWithResponse(stimulus, i % 2 == 0);
            }
        }

        // ─── Resultat ────────────────────────────────────────────────────

        [Test]
        public void GetResult_ReturnsCorrectTotalDeviation()
        {
            var zest = new ZestPoint(_normalPoint);

            // Simulér patient med let nedsat syn
            float trueThreshold = 25f; // 5.5 dB under normativ
            for (int i = 0; i < 50 && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                zest.UpdateWithResponse(stimulus, stimulus <= trueThreshold);
            }

            var result = zest.GetResult(_normalPoint.NormativeThresholdDb);
            Assert.AreEqual(zest.GridPointId, result.GridPointId);
            // Total deviation bør være negativ (nedsat syn)
            Assert.Less(result.TotalDeviationDb, 0,
                "Total deviation bør være negativ for nedsat syn");
            Assert.AreEqual(result.ThresholdDb - _normalPoint.NormativeThresholdDb,
                result.TotalDeviationDb, 0.01f);
        }

        // ─── Posterior opdatering ────────────────────────────────────────

        [Test]
        public void UpdateWithResponse_Seen_ShiftsEstimateDown()
        {
            var zest = new ZestPoint(_normalPoint);
            double initialEstimate = zest.EstimatedThresholdDb;

            // Patienten ser stimulus ved tærskelværdi → tærskel er sandsynligvis højere
            zest.UpdateWithResponse(initialEstimate, true);

            Assert.Greater(zest.EstimatedThresholdDb, initialEstimate,
                "Set stimulus ved tærskel → estimat bør stige (patient kan se ved denne intensitet)");
        }

        [Test]
        public void UpdateWithResponse_NotSeen_ShiftsEstimateDown()
        {
            var zest = new ZestPoint(_normalPoint);
            double initialEstimate = zest.EstimatedThresholdDb;

            // Patienten ser IKKE stimulus ved tærskelværdi → tærskel er sandsynligvis lavere
            zest.UpdateWithResponse(initialEstimate, false);

            Assert.Less(zest.EstimatedThresholdDb, initialEstimate,
                "Ikke-set stimulus ved tærskel → estimat bør falde (patient kan ikke se ved denne intensitet)");
        }

        // ─── Config-varianter ────────────────────────────────────────────

        [Test]
        public void CustomConfig_RespectsStopCriterion()
        {
            var strictConfig = new ZestConfig(
                dbMin: 0f, dbMax: 51f, dbStep: 1f,
                stopSdDb: 0.5f, // Strengere end standard
                maxStimuli: 100);

            var zest = new ZestPoint(_normalPoint, strictConfig);
            float trueThreshold = 30.5f;

            for (int i = 0; i < 100 && !zest.IsConverged; i++)
            {
                double stimulus = zest.GetNextStimulusDb();
                zest.UpdateWithResponse(stimulus, stimulus <= trueThreshold);
            }

            // Med strengere SD kræves flere stimuli
            Assert.IsTrue(zest.IsConverged);
            Assert.Less(zest.PosteriorSdDb, 0.5,
                "Posterior SD bør være under strengt stopkriterium");
        }
    }
}
