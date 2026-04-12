using NUnit.Framework;
using UnityEngine;
using VisionField.Core;
using VisionField.Stimuli;

/// <summary>
/// EditMode tests for StimulusRenderer konverteringsfunktioner.
/// Verificerer dB → luminans og grader → VR-position konvertering.
///
/// NOTE: Timing-tests kræver PlayMode (coroutines). Disse tests dækker
/// de rene matematiske konverteringer der kan testes i EditMode.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class StimulusRendererTests
    {
        // ─── dB → Luminans konvertering ──────────────────────────────────

        [Test]
        public void DbToLuminanceFactor_0dB_ReturnsOne()
        {
            // 0 dB = max luminans → factor = 10^(0) = 1.0
            float factor = StimulusRenderer.DbToLuminanceFactor(0f);
            Assert.AreEqual(1.0f, factor, 0.001f,
                "0 dB skal give luminans-faktor 1.0 (max)");
        }

        [Test]
        public void DbToLuminanceFactor_10dB_ReturnsTenth()
        {
            // 10 dB → factor = 10^(-10/10) = 0.1
            float factor = StimulusRenderer.DbToLuminanceFactor(10f);
            Assert.AreEqual(0.1f, factor, 0.001f,
                "10 dB skal give luminans-faktor 0.1");
        }

        [Test]
        public void DbToLuminanceFactor_20dB_ReturnsHundredth()
        {
            // 20 dB → factor = 10^(-20/10) = 0.01
            float factor = StimulusRenderer.DbToLuminanceFactor(20f);
            Assert.AreEqual(0.01f, factor, 0.0001f,
                "20 dB skal give luminans-faktor 0.01");
        }

        [Test]
        public void DbToLuminanceFactor_51dB_ReturnsMinimum()
        {
            // 51 dB = minimum luminans
            float factor = StimulusRenderer.DbToLuminanceFactor(51f);
            Assert.Greater(factor, 0f, "Luminans-faktor skal være positiv");
            Assert.Less(factor, 0.001f, "51 dB skal give meget lav luminans");
        }

        [Test]
        public void DbToLuminanceFactor_MonotonicallyDecreasing()
        {
            float prev = StimulusRenderer.DbToLuminanceFactor(0f);
            for (int db = 1; db <= 51; db++)
            {
                float current = StimulusRenderer.DbToLuminanceFactor(db);
                Assert.Less(current, prev,
                    $"Luminans ved {db} dB bør være lavere end ved {db - 1} dB");
                prev = current;
            }
        }

        [Test]
        public void DbToLuminanceFactor_ClampsToValidRange()
        {
            // Under minimum
            float factorLow = StimulusRenderer.DbToLuminanceFactor(-5f);
            float factorZero = StimulusRenderer.DbToLuminanceFactor(0f);
            Assert.AreEqual(factorZero, factorLow, 0.001f,
                "Negative dB bør clampes til 0 dB");

            // Over maximum
            float factorHigh = StimulusRenderer.DbToLuminanceFactor(60f);
            float factorMax = StimulusRenderer.DbToLuminanceFactor(51f);
            Assert.AreEqual(factorMax, factorHigh, 0.0001f,
                "dB over 51 bør clampes til 51 dB");
        }

        // ─── Luminans → dB roundtrip ─────────────────────────────────────

        [Test]
        public void LuminanceFactorToDb_Roundtrip()
        {
            for (int db = 0; db <= 51; db++)
            {
                float factor = StimulusRenderer.DbToLuminanceFactor(db);
                float roundtrip = StimulusRenderer.LuminanceFactorToDb(factor);
                Assert.AreEqual(db, roundtrip, 0.1f,
                    $"Roundtrip fejlede for {db} dB");
            }
        }

        // ─── Grader → VR-position ────────────────────────────────────────

        [Test]
        public void DegreesToWorldPosition_Center_ReturnsForward()
        {
            var renderer = CreateTestRenderer();
            Vector3 pos = renderer.DegreesToWorldPosition(0f, 0f);

            Assert.AreEqual(0f, pos.x, 0.001f, "Center x bør være 0");
            Assert.AreEqual(0f, pos.y, 0.001f, "Center y bør være 0");
            Assert.Greater(pos.z, 0f, "Center z bør være positiv (fremad)");
        }

        [Test]
        public void DegreesToWorldPosition_Temporal_MovesRight()
        {
            var renderer = CreateTestRenderer();
            Vector3 pos = renderer.DegreesToWorldPosition(15f, 0f);

            Assert.Greater(pos.x, 0f, "Temporal (positiv x) bør give positiv x-position");
            Assert.AreEqual(0f, pos.y, 0.01f, "Horisontal stimulus bør have y ≈ 0");
        }

        [Test]
        public void DegreesToWorldPosition_Superior_MovesUp()
        {
            var renderer = CreateTestRenderer();
            Vector3 pos = renderer.DegreesToWorldPosition(0f, 15f);

            Assert.AreEqual(0f, pos.x, 0.01f, "Vertikal stimulus bør have x ≈ 0");
            Assert.Greater(pos.y, 0f, "Superior (positiv y) bør give positiv y-position");
        }

        [Test]
        public void DegreesToWorldPosition_Symmetry()
        {
            var renderer = CreateTestRenderer();
            Vector3 posRight = renderer.DegreesToWorldPosition(10f, 5f);
            Vector3 posLeft = renderer.DegreesToWorldPosition(-10f, 5f);

            Assert.AreEqual(-posRight.x, posLeft.x, 0.001f,
                "Symmetriske punkter bør have symmetriske x-positioner");
            Assert.AreEqual(posRight.y, posLeft.y, 0.001f,
                "Symmetriske punkter bør have ens y-positioner");
        }

        // ─── Goldmann III størrelse ──────────────────────────────────────

        [Test]
        public void DegreesToMeters_GoldmannIII()
        {
            var renderer = CreateTestRenderer();
            float sizeM = renderer.DegreesToMeters(ClinicalConstants.STIMULUS_DIAMETER_DEG);

            Assert.Greater(sizeM, 0f, "Stimulus størrelse skal være positiv");
            // Ved 1m afstand: 0.43° ≈ 0.0075m (7.5mm)
            Assert.AreEqual(0.0075f, sizeM, 0.001f,
                "Goldmann III ved 1m bør være ca. 7.5mm");
        }

        // ─── Kliniske konstanter ─────────────────────────────────────────

        [Test]
        public void StimulusDuration_IsExactly200ms()
        {
            // KLINISK KRITISK: Denne test verificerer at konstanten er korrekt
            Assert.AreEqual(200, ClinicalConstants.STIMULUS_DURATION_MS,
                "Stimulusvarighed SKAL være præcis 200ms");
        }

        [Test]
        public void StimulusTolerance_Is5ms()
        {
            Assert.AreEqual(5, ClinicalConstants.STIMULUS_TIMING_TOLERANCE_MS);
        }

        [Test]
        public void GoldmannIII_Is043Degrees()
        {
            Assert.AreEqual(0.43f, ClinicalConstants.STIMULUS_DIAMETER_DEG, 0.001f);
        }

        [Test]
        public void ZestStopCriterion_Is1Point5dB()
        {
            // KLINISK KRITISK: Denne værdi må IKKE ændres uden godkendelse
            Assert.AreEqual(1.5f, ClinicalConstants.ZEST_STOP_SD_DB, 0.001f);
        }

        // ─── StimulusTimingValidator ─────────────────────────────────────

        [Test]
        public void TimingValidator_InitialState()
        {
            var validator = new StimulusTimingValidator();
            Assert.AreEqual(0, validator.TotalStimuli);
            Assert.AreEqual(0, validator.TimingViolations);
            Assert.AreEqual(0f, validator.MaxDeviationMs);
        }

        [Test]
        public void TimingValidator_Reset_ClearsState()
        {
            var validator = new StimulusTimingValidator();
            validator.MarkStimulusStart();
            validator.MarkStimulusEnd();
            validator.Reset();

            Assert.AreEqual(0, validator.TotalStimuli);
            Assert.AreEqual(0, validator.TimingViolations);
            Assert.AreEqual(0f, validator.MaxDeviationMs);
        }

        // ─── Hjælpefunktioner ────────────────────────────────────────────

        private StimulusRenderer CreateTestRenderer()
        {
            var go = new GameObject("TestStimulusRenderer");
            var renderer = go.AddComponent<StimulusRenderer>();
            return renderer;
        }

        [TearDown]
        public void TearDown()
        {
            // Ryd op efter tests der opretter GameObjects
            var renderers = Object.FindObjectsOfType<StimulusRenderer>();
            foreach (var r in renderers)
                Object.DestroyImmediate(r.gameObject);
        }
    }
}
