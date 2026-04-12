using NUnit.Framework;
using UnityEngine;
using VisionField.Core;
using VisionField.EyeTracking;

/// <summary>
/// EditMode tests for EyeTrackingUtils.
/// Verificerer koordinatkonvertering, vinkelberegning og fiksationsvurdering.
///
/// KLINISK KRITISK: Fejl i vinkelberegning kan føre til forkert
/// fiksationsvurdering og dermed ugyldige testresultater.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class EyeTrackingUtilsTests
    {
        // ─── ToLocalSpace ────────────────────────────────────────────────

        [Test]
        public void ToLocalSpace_IdentityRotation_ReturnsSameDirection()
        {
            Vector3 rawGaze = new Vector3(0, 0, 1); // Lige frem
            Vector3 headPos = Vector3.zero;
            Quaternion headRot = Quaternion.identity;

            Vector3 local = EyeTrackingUtils.ToLocalSpace(rawGaze, headPos, headRot);

            Assert.AreEqual(0f, local.x, 0.001f);
            Assert.AreEqual(0f, local.y, 0.001f);
            Assert.AreEqual(1f, local.z, 0.001f);
        }

        [Test]
        public void ToLocalSpace_HeadRotated90Right_TransformsCorrectly()
        {
            // Gaze peger frem i world space, men hovedet er roteret 90° til højre
            Vector3 rawGaze = new Vector3(0, 0, 1);
            Vector3 headPos = Vector3.zero;
            // 90° rotation around Y-axis: forward becomes left in local space
            Quaternion headRot = Quaternion.Euler(0, 90, 0);

            Vector3 local = EyeTrackingUtils.ToLocalSpace(rawGaze, headPos, headRot);

            // Gaze i world-forward → i lokal headspace: patienten kigger til venstre
            Assert.Less(local.x, -0.9f, "Bør pege til venstre i lokal headspace");
            Assert.AreEqual(0f, local.y, 0.1f);
        }

        [Test]
        public void ToLocalSpace_ReturnsNormalizedVector()
        {
            Vector3 rawGaze = new Vector3(3, 4, 0); // Ikke normaliseret
            Vector3 local = EyeTrackingUtils.ToLocalSpace(rawGaze, Vector3.zero, Quaternion.identity);

            float mag = (float)System.Math.Sqrt(local.x * local.x + local.y * local.y + local.z * local.z);
            Assert.AreEqual(1f, mag, 0.001f, "Output skal være normaliseret");
        }

        // ─── CalculateDeviationDeg ───────────────────────────────────────

        [Test]
        public void CalculateDeviationDeg_SameDirection_ReturnsZero()
        {
            Vector3 gaze = new Vector3(0, 0, 1);
            Vector3 fixation = new Vector3(0, 0, 1);

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(0f, deviation, 0.01f, "Identiske retninger → 0° afvigelse");
        }

        [Test]
        public void CalculateDeviationDeg_90Degrees_Returns90()
        {
            Vector3 gaze = new Vector3(1, 0, 0); // Til højre
            Vector3 fixation = new Vector3(0, 0, 1); // Lige frem

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(90f, deviation, 0.1f);
        }

        [Test]
        public void CalculateDeviationDeg_180Degrees_Returns180()
        {
            Vector3 gaze = new Vector3(0, 0, -1); // Bagud
            Vector3 fixation = new Vector3(0, 0, 1); // Frem

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(180f, deviation, 0.1f);
        }

        [Test]
        public void CalculateDeviationDeg_SmallAngle_CorrectPrecision()
        {
            // 2° afvigelse i x-retning
            float angleRad = 2f * (float)System.Math.PI / 180f;
            Vector3 gaze = new Vector3((float)System.Math.Sin(angleRad), 0, (float)System.Math.Cos(angleRad));
            Vector3 fixation = new Vector3(0, 0, 1);

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(2f, deviation, 0.05f,
                "2° afvigelse skal beregnes korrekt (klinisk relevant grænse)");
        }

        [Test]
        public void CalculateDeviationDeg_ZeroVector_ReturnsMaxValue()
        {
            Vector3 gaze = new Vector3(0, 0, 0);
            Vector3 fixation = new Vector3(0, 0, 1);

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(float.MaxValue, deviation,
                "Nul-vektor bør give max afvigelse (ugyldigt sample)");
        }

        [Test]
        public void CalculateDeviationDeg_UnnormalizedVectors_StillCorrect()
        {
            Vector3 gaze = new Vector3(0, 0, 5); // Ikke normaliseret
            Vector3 fixation = new Vector3(0, 0, 3);

            float deviation = EyeTrackingUtils.CalculateDeviationDeg(gaze, fixation);

            Assert.AreEqual(0f, deviation, 0.01f,
                "Parallelle vektorer med forskellig længde → 0° afvigelse");
        }

        [Test]
        public void CalculateDeviationDeg_SymmetricDeviations()
        {
            Vector3 fixation = new Vector3(0, 0, 1);
            Vector3 gazeRight = new Vector3(0.1f, 0, 1);
            Vector3 gazeLeft = new Vector3(-0.1f, 0, 1);

            float devRight = EyeTrackingUtils.CalculateDeviationDeg(gazeRight, fixation);
            float devLeft = EyeTrackingUtils.CalculateDeviationDeg(gazeLeft, fixation);

            Assert.AreEqual(devRight, devLeft, 0.01f,
                "Symmetriske afvigelser bør give identisk vinkel");
        }

        // ─── IsFixationStable ────────────────────────────────────────────

        [Test]
        public void IsFixationStable_BelowThreshold_ReturnsTrue()
        {
            Assert.IsTrue(EyeTrackingUtils.IsFixationStable(1.5f, 2.0f));
        }

        [Test]
        public void IsFixationStable_AtThreshold_ReturnsTrue()
        {
            Assert.IsTrue(EyeTrackingUtils.IsFixationStable(2.0f, 2.0f),
                "Præcis på tærskel = stabil");
        }

        [Test]
        public void IsFixationStable_AboveThreshold_ReturnsFalse()
        {
            Assert.IsFalse(EyeTrackingUtils.IsFixationStable(2.1f, 2.0f));
        }

        [Test]
        public void IsFixationStable_DefaultThreshold_Uses2Degrees()
        {
            Assert.IsTrue(EyeTrackingUtils.IsFixationStable(1.9f),
                "Standard tærskel er 2.0° (ClinicalConstants)");
            Assert.IsFalse(EyeTrackingUtils.IsFixationStable(2.1f));
        }

        // ─── Klinisk konstant-verifikation ───────────────────────────────

        [Test]
        public void FixationThreshold_Is2Degrees()
        {
            Assert.AreEqual(2.0f, ClinicalConstants.FIXATION_THRESHOLD_DEG, 0.001f);
        }

        [Test]
        public void EyeTrackingWarmup_Is500ms()
        {
            Assert.AreEqual(500, ClinicalConstants.EYE_TRACKING_WARMUP_MS);
        }
    }
}
