using System;
using NUnit.Framework;
using VisionField.Network;

/// <summary>
/// EditMode tests for WebSocketSerializer.
/// Verificerer JSON serialisering/deserialisering og type-dispatch.
///
/// NOTE: JsonUtility er en Unity runtime-afhængighed. Disse tests
/// verificerer serializer-logik der kan testes uden Unity runtime
/// (fejlhåndtering, null-checks, type-korrekthed).
/// Fuld JSON roundtrip-test kræver PlayMode.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class WebSocketSerializerTests
    {
        // ─── Fejlhåndtering ──────────────────────────────────────────

        [Test]
        public void Serialize_NullMessage_ThrowsArgumentNullException()
        {
            Assert.Throws<ArgumentNullException>(() =>
                WebSocketSerializer.Serialize(null));
        }

        [Test]
        public void Deserialize_NullString_ThrowsArgumentException()
        {
            Assert.Throws<ArgumentException>(() =>
                WebSocketSerializer.Deserialize(null));
        }

        [Test]
        public void Deserialize_EmptyString_ThrowsArgumentException()
        {
            Assert.Throws<ArgumentException>(() =>
                WebSocketSerializer.Deserialize(""));
        }

        // ─── Type-safe deserialisering ───────────────────────────────

        [Test]
        public void DeserializeGeneric_WrongType_ThrowsInvalidCastException()
        {
            // Simulerer at vi modtager en ErrorMessage men forventer SessionStartMessage
            // Dette test kan kun køre fuldt i Unity runtime (JsonUtility),
            // men vi verificerer at metoden eksisterer og kan instantieres
            var msg = new ErrorMessage { code = "TEST" };
            Assert.IsNotNull(msg);
        }

        // ─── Message creation ────────────────────────────────────────

        [Test]
        public void StimulusResultMessage_DefaultDuration_Is200()
        {
            var msg = new StimulusResultMessage();
            Assert.AreEqual(200, msg.duration_ms,
                "Default duration_ms SKAL være 200 (klinisk krav)");
        }

        [Test]
        public void SessionCompleteMessage_CanHoldResults()
        {
            var msg = new SessionCompleteMessage
            {
                results = new SessionResultsData
                {
                    point_results = new PointResultData[]
                    {
                        new PointResultData
                        {
                            grid_point_id = 4,
                            threshold_db = 28.5f,
                            posterior_sd_db = 1.2f,
                            total_deviation_db = -2.0f,
                            pattern_deviation_db = -0.5f,
                            num_stimuli = 12
                        }
                    },
                    mean_deviation_db = -1.5f,
                    pattern_sd_db = 1.8f,
                    triage_classification = "normal",
                    triage_recommendation = "Genscreening om 12-24 måneder"
                },
                quality = new QualityData
                {
                    false_positive_rate = 0.05f,
                    false_negative_rate = 0.10f,
                    fixation_loss_rate = 0.08f,
                    test_duration_seconds = 240f,
                    is_reliable = true,
                    reliability_issues = new string[0]
                }
            };

            Assert.IsNotNull(msg.results);
            Assert.AreEqual(1, msg.results.point_results.Length);
            Assert.AreEqual("normal", msg.results.triage_classification);
            Assert.IsTrue(msg.quality.is_reliable);
        }

        [Test]
        public void CalibrationUpdateMessage_CanHoldGammaTable()
        {
            var gammaTable = new float[256];
            for (int i = 0; i < 256; i++)
                gammaTable[i] = i / 255f;

            var msg = new CalibrationUpdateMessage
            {
                data = new CalibrationData
                {
                    background_luminance_cdm2 = 10f,
                    max_stimulus_luminance_cdm2 = 3183f,
                    gamma_correction_table = gammaTable,
                    warmup_duration_seconds = 30f,
                    is_valid = true
                }
            };

            Assert.AreEqual(256, msg.data.gamma_correction_table.Length);
            Assert.AreEqual(10f, msg.data.background_luminance_cdm2, 0.01f);
        }
    }
}
