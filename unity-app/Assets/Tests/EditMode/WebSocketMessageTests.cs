using NUnit.Framework;
using VisionField.Core;
using VisionField.Network;

/// <summary>
/// EditMode tests for WebSocket beskedtyper.
/// Verificerer at alle event-typer instantieres korrekt
/// og at type-strenge matcher shared/types/index.ts kontrakten.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class WebSocketMessageTests
    {
        // ─── Event type konstanter ───────────────────────────────────

        [Test]
        public void EventType_Constants_MatchTypeScriptContract()
        {
            // Disse strenge SKAL matche WebSocketEvent.type i shared/types/index.ts
            Assert.AreEqual("SESSION_START", EventType.SESSION_START);
            Assert.AreEqual("STIMULUS_RESULT", EventType.STIMULUS_RESULT);
            Assert.AreEqual("FIXATION_UPDATE", EventType.FIXATION_UPDATE);
            Assert.AreEqual("SESSION_COMPLETE", EventType.SESSION_COMPLETE);
            Assert.AreEqual("SESSION_ABORT", EventType.SESSION_ABORT);
            Assert.AreEqual("CALIBRATION_UPDATE", EventType.CALIBRATION_UPDATE);
            Assert.AreEqual("ERROR", EventType.ERROR);
        }

        // ─── Besked-instantiering ────────────────────────────────────

        [Test]
        public void SessionStartMessage_HasCorrectType()
        {
            var msg = new SessionStartMessage();
            Assert.AreEqual(EventType.SESSION_START, msg.type);
        }

        [Test]
        public void StimulusResultMessage_HasCorrectType_And200msDuration()
        {
            var msg = new StimulusResultMessage();
            Assert.AreEqual(EventType.STIMULUS_RESULT, msg.type);
            // KLINISK KRITISK: duration_ms SKAL altid være 200
            Assert.AreEqual(ClinicalConstants.STIMULUS_DURATION_MS, msg.duration_ms,
                "StimulusResult.duration_ms SKAL være 200ms (hardcoded)");
        }

        [Test]
        public void FixationUpdateMessage_HasCorrectType()
        {
            var msg = new FixationUpdateMessage();
            Assert.AreEqual(EventType.FIXATION_UPDATE, msg.type);
        }

        [Test]
        public void SessionCompleteMessage_HasCorrectType()
        {
            var msg = new SessionCompleteMessage();
            Assert.AreEqual(EventType.SESSION_COMPLETE, msg.type);
        }

        [Test]
        public void SessionAbortMessage_HasCorrectType()
        {
            var msg = new SessionAbortMessage();
            Assert.AreEqual(EventType.SESSION_ABORT, msg.type);
        }

        [Test]
        public void CalibrationUpdateMessage_HasCorrectType()
        {
            var msg = new CalibrationUpdateMessage();
            Assert.AreEqual(EventType.CALIBRATION_UPDATE, msg.type);
        }

        [Test]
        public void ErrorMessage_HasCorrectType()
        {
            var msg = new ErrorMessage();
            Assert.AreEqual(EventType.ERROR, msg.type);
        }

        // ─── Beskedfelter ────────────────────────────────────────────

        [Test]
        public void StimulusResultMessage_Fields_CanBeSet()
        {
            var msg = new StimulusResultMessage
            {
                stimulus_id = "test-uuid",
                session_id = "session-uuid",
                grid_point_id = 4,
                presented_at_ms = 5000,
                intensity_db = 25.5f,
                x_deg = -3f,
                y_deg = 3f,
                is_catch_trial = false,
                catch_trial_type = null,
                responded = true,
                response_time_ms = 350f,
                fixation_ok = true,
                fixation_deviation_deg = 0.8f
            };

            Assert.AreEqual(4, msg.grid_point_id);
            Assert.AreEqual(25.5f, msg.intensity_db, 0.01f);
            Assert.IsTrue(msg.responded);
            Assert.IsTrue(msg.fixation_ok);
            Assert.AreEqual(200, msg.duration_ms); // Altid 200
        }

        [Test]
        public void FixationUpdateMessage_Fields_CanBeSet()
        {
            var msg = new FixationUpdateMessage
            {
                is_ok = true,
                deviation_deg = 1.2f
            };

            Assert.IsTrue(msg.is_ok);
            Assert.AreEqual(1.2f, msg.deviation_deg, 0.01f);
        }

        [Test]
        public void ErrorMessage_NoPatientData()
        {
            // SIKKERHED: ErrorMessage har INGEN felter til patientdata
            var msg = new ErrorMessage
            {
                code = "CALIBRATION_INVALID",
                recoverable = true
            };

            Assert.AreEqual("CALIBRATION_INVALID", msg.code);
            Assert.IsTrue(msg.recoverable);
            // Ingen patient-specifikke felter eksisterer på ErrorMessage
        }

        // ─── Catch trial type strenge ────────────────────────────────

        [Test]
        public void CatchTrialType_Strings_MatchContract()
        {
            // Disse strenge matcher catch_trial_type i shared/types/index.ts
            var msgFP = new StimulusResultMessage { catch_trial_type = "false_positive" };
            var msgFN = new StimulusResultMessage { catch_trial_type = "false_negative" };

            Assert.AreEqual("false_positive", msgFP.catch_trial_type);
            Assert.AreEqual("false_negative", msgFN.catch_trial_type);
        }
    }
}
