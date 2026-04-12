using NUnit.Framework;
using VisionField.Core.Models;
using VisionField.UI;

/// <summary>
/// EditMode tests for TestStateMachine.
/// Verificerer alle gyldige og ugyldige state transitions.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class TestStateMachineTests
    {
        // ─── Gyldige transitions ─────────────────────────────────────

        [Test]
        public void Transition_Initializing_To_Calibrating_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Initializing, TestStatus.Calibrating));
        }

        [Test]
        public void Transition_Calibrating_To_Running_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Calibrating, TestStatus.Running));
        }

        [Test]
        public void Transition_Running_To_Paused_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Running, TestStatus.Paused));
        }

        [Test]
        public void Transition_Paused_To_Running_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Paused, TestStatus.Running));
        }

        [Test]
        public void Transition_Running_To_Completed_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Running, TestStatus.Completed));
        }

        [Test]
        public void Transition_Running_To_Invalid_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Running, TestStatus.Invalid));
        }

        [Test]
        public void Transition_Completed_To_Initializing_IsValid()
        {
            // Tillader start af ny test (andet øje)
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Completed, TestStatus.Initializing));
        }

        [Test]
        public void Transition_Invalid_To_Initializing_IsValid()
        {
            // Retry efter ugyldig test
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Invalid, TestStatus.Initializing));
        }

        [Test]
        public void Transition_Aborted_To_Initializing_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Aborted, TestStatus.Initializing));
        }

        // ─── Abort fra alle aktive states ────────────────────────────

        [Test]
        public void Transition_AnyActiveState_To_Aborted_IsValid()
        {
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Initializing, TestStatus.Aborted));
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Calibrating, TestStatus.Aborted));
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Running, TestStatus.Aborted));
            Assert.IsTrue(TestStateMachine.IsValidTransition(
                TestStatus.Paused, TestStatus.Aborted));
        }

        // ─── Ugyldige transitions ───────────────────────────────────

        [Test]
        public void Transition_Initializing_To_Running_IsInvalid()
        {
            // Kan ikke springe kalibrering over
            Assert.IsFalse(TestStateMachine.IsValidTransition(
                TestStatus.Initializing, TestStatus.Running));
        }

        [Test]
        public void Transition_Calibrating_To_Completed_IsInvalid()
        {
            Assert.IsFalse(TestStateMachine.IsValidTransition(
                TestStatus.Calibrating, TestStatus.Completed));
        }

        [Test]
        public void Transition_Paused_To_Completed_IsInvalid()
        {
            // Kan ikke afslutte direkte fra pause
            Assert.IsFalse(TestStateMachine.IsValidTransition(
                TestStatus.Paused, TestStatus.Completed));
        }

        [Test]
        public void Transition_Completed_To_Running_IsInvalid()
        {
            // Kan ikke genoptage en afsluttet test
            Assert.IsFalse(TestStateMachine.IsValidTransition(
                TestStatus.Completed, TestStatus.Running));
        }

        [Test]
        public void Transition_Initializing_To_Completed_IsInvalid()
        {
            Assert.IsFalse(TestStateMachine.IsValidTransition(
                TestStatus.Initializing, TestStatus.Completed));
        }
    }
}
