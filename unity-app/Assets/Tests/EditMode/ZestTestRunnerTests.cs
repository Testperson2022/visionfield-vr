using System.Collections.Generic;
using NUnit.Framework;
using VisionField.Core;
using VisionField.Core.Data;
using VisionField.Core.Models;

/// <summary>
/// EditMode tests for ZestTestRunner.
/// Verificerer testsession-orkestering, catch trials, triage og kvalitetskontrol.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class ZestTestRunnerTests
    {
        // ─── Grundlæggende test-flow ─────────────────────────────────────

        [Test]
        public void GetNextStimulus_ReturnsNonNull_WhenNotComplete()
        {
            var runner = new ZestTestRunner(Eye.OD, seed: 42);
            var request = runner.GetNextStimulus();

            Assert.IsNotNull(request);
            Assert.IsFalse(runner.IsComplete);
        }

        [Test]
        public void FullTest_ConvergesAllPoints()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 0, seed: 42);
            int stimuliCount = 0;
            int maxStimuli = 54 * 50 + 100; // Worst case + margin

            while (!runner.IsComplete && stimuliCount < maxStimuli)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;

                // Simulér normal syn: ser alt under 30 dB
                bool seen = request.IntensityDb >= 25f;
                runner.RecordResponse(
                    request.GridPointId, seen, request.IntensityDb,
                    fixationOk: true, catchTrialType: request.CatchTrialType);
                stimuliCount++;
            }

            Assert.IsTrue(runner.IsComplete, "Alle punkter bør konvergere");
            Assert.Greater(stimuliCount, 0);
        }

        // ─── Catch trials ────────────────────────────────────────────────

        [Test]
        public void CatchTrials_AreGenerated_WhenEnabled()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 2, seed: 42);
            int catchTrialCount = 0;
            int totalStimuli = 0;

            for (int i = 0; i < 200 && !runner.IsComplete; i++)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;

                if (request.CatchTrialType != CatchTrialType.None)
                    catchTrialCount++;

                runner.RecordResponse(
                    request.GridPointId, request.IntensityDb >= 25f,
                    request.IntensityDb, fixationOk: true,
                    catchTrialType: request.CatchTrialType);
                totalStimuli++;
            }

            Assert.Greater(catchTrialCount, 0,
                "Der bør genereres catch trials med frekvens 2/10");
        }

        [Test]
        public void FalsePositiveCatchTrial_AtBlindSpot_OD()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 3, seed: 123);
            int blindSpotId = TestGrid24_2.GetBlindSpotPointId(Eye.OD);
            bool foundFPCatchTrial = false;

            for (int i = 0; i < 500 && !runner.IsComplete; i++)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;

                if (request.CatchTrialType == CatchTrialType.FalsePositive)
                {
                    Assert.AreEqual(blindSpotId, request.GridPointId,
                        "FP catch trial skal præsenteres ved blind spot");
                    foundFPCatchTrial = true;
                }

                runner.RecordResponse(
                    request.GridPointId, request.IntensityDb >= 25f,
                    request.IntensityDb, fixationOk: true,
                    catchTrialType: request.CatchTrialType);
            }

            Assert.IsTrue(foundFPCatchTrial, "Bør finde mindst én FP catch trial");
        }

        // ─── Triage-klassifikation ───────────────────────────────────────

        [Test]
        public void ClassifyTriage_Normal()
        {
            var (classification, _) = ZestTestRunner.ClassifyTriage(mdDb: -1f, psdDb: 1.5f);
            Assert.AreEqual(TriageClassification.Normal, classification);
        }

        [Test]
        public void ClassifyTriage_Borderline_MD()
        {
            var (classification, _) = ZestTestRunner.ClassifyTriage(mdDb: -3f, psdDb: 1.5f);
            Assert.AreEqual(TriageClassification.Borderline, classification);
        }

        [Test]
        public void ClassifyTriage_Borderline_PSD()
        {
            var (classification, _) = ZestTestRunner.ClassifyTriage(mdDb: -1f, psdDb: 2.5f);
            Assert.AreEqual(TriageClassification.Borderline, classification);
        }

        [Test]
        public void ClassifyTriage_Abnormal_MD()
        {
            var (classification, _) = ZestTestRunner.ClassifyTriage(mdDb: -7f, psdDb: 1.5f);
            Assert.AreEqual(TriageClassification.Abnormal, classification);
        }

        [Test]
        public void ClassifyTriage_Abnormal_PSD()
        {
            var (classification, _) = ZestTestRunner.ClassifyTriage(mdDb: -1f, psdDb: 3.5f);
            Assert.AreEqual(TriageClassification.Abnormal, classification);
        }

        [Test]
        public void ClassifyTriage_BoundaryValues()
        {
            // Præcis på grænsen: MD = -2 er borderline (< -2)
            var (atNormal, _) = ZestTestRunner.ClassifyTriage(mdDb: -2f, psdDb: 1.9f);
            Assert.AreEqual(TriageClassification.Normal, atNormal,
                "MD = -2 og PSD < 2.0 er normal (grænsen er UNDER -2)");

            // MD = -6 er borderline (grænsen for abnormal er UNDER -6)
            var (atBorderline, _) = ZestTestRunner.ClassifyTriage(mdDb: -6f, psdDb: 1.5f);
            Assert.AreEqual(TriageClassification.Borderline, atBorderline,
                "MD = -6 er borderline (grænsen for abnormal er under -6)");
        }

        // ─── Kvalitetsmetrics ────────────────────────────────────────────

        [Test]
        public void QualityMetrics_Reliable_WhenRatesLow()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 0, seed: 42);

            // Kør kort test med god fiksation
            for (int i = 0; i < 100 && !runner.IsComplete; i++)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;
                runner.RecordResponse(
                    request.GridPointId, request.IntensityDb >= 25f,
                    request.IntensityDb, fixationOk: true,
                    catchTrialType: request.CatchTrialType);
            }

            var quality = runner.ComputeQualityMetrics(180f);
            Assert.IsTrue(quality.IsReliable);
            Assert.AreEqual(0, quality.ReliabilityIssues.Length);
        }

        [Test]
        public void QualityMetrics_FixationLoss_Tracked()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 0, seed: 42);

            // Simulér dårlig fiksation
            for (int i = 0; i < 50 && !runner.IsComplete; i++)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;
                runner.RecordResponse(
                    request.GridPointId, request.IntensityDb >= 25f,
                    request.IntensityDb, fixationOk: false, // Dårlig fiksation
                    catchTrialType: request.CatchTrialType);
            }

            var quality = runner.ComputeQualityMetrics(180f);
            Assert.AreEqual(1.0f, quality.FixationLossRate, 0.01f,
                "Alle fiksationer var dårlige → rate = 1.0");
        }

        // ─── Mean Deviation ──────────────────────────────────────────────

        [Test]
        public void ComputeResults_MD_NearZero_ForNormalVision()
        {
            var runner = new ZestTestRunner(Eye.OD, catchTrialFrequencyPer10: 0, seed: 42);

            while (!runner.IsComplete)
            {
                var request = runner.GetNextStimulus();
                if (request == null) break;

                // Simulér perfekt normal syn: ser alt ved normativ tærskel
                bool seen = request.IntensityDb >= 25f;
                runner.RecordResponse(
                    request.GridPointId, seen, request.IntensityDb,
                    fixationOk: true, catchTrialType: request.CatchTrialType);
            }

            var results = runner.ComputeResults();
            // MD bør være nær 0 for normal syn (med nogen tolerance pga. algoritmisk usikkerhed)
            Assert.AreEqual(0f, results.MeanDeviationDb, 5f,
                $"MD ({results.MeanDeviationDb:F1} dB) bør være tæt på 0 for normal syn");
        }

        // ─── Testgrid ────────────────────────────────────────────────────

        [Test]
        public void TestGrid_Has54Points()
        {
            Assert.AreEqual(54, TestGrid24_2.Grid.Length);
        }

        [Test]
        public void TestGrid_BlindSpotOD_IsPoint16()
        {
            Assert.AreEqual(16, TestGrid24_2.GetBlindSpotPointId(Eye.OD));
            Assert.IsTrue(TestGrid24_2.Grid[16].IsBlindSpot);
        }

        [Test]
        public void TestGrid_BlindSpotOS_IsPoint50()
        {
            Assert.AreEqual(50, TestGrid24_2.GetBlindSpotPointId(Eye.OS));
            Assert.IsTrue(TestGrid24_2.Grid[50].IsBlindSpot);
        }

        [Test]
        public void TestGrid_NonBlindSpotPoints_Has52Points()
        {
            var nonBlindSpot = TestGrid24_2.GetNonBlindSpotPoints();
            Assert.AreEqual(52, nonBlindSpot.Length);
        }
    }
}
