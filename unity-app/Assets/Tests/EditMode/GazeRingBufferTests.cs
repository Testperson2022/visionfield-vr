using NUnit.Framework;
using VisionField.EyeTracking;

/// <summary>
/// EditMode tests for GazeRingBuffer.
/// Verificerer ring buffer-logik, tidsfiltrering og fiksationsvurdering.
/// </summary>
namespace VisionField.Tests
{
    [TestFixture]
    public class GazeRingBufferTests
    {
        // ─── Grundlæggende buffer-operationer ────────────────────────────

        [Test]
        public void NewBuffer_IsEmpty()
        {
            var buffer = new GazeRingBuffer(10);
            Assert.AreEqual(0, buffer.Count);
            Assert.AreEqual(10, buffer.Capacity);
        }

        [Test]
        public void Add_IncrementsCount()
        {
            var buffer = new GazeRingBuffer(10);
            buffer.Add(MakeSample(0f, 0f));
            Assert.AreEqual(1, buffer.Count);

            buffer.Add(MakeSample(0.01f, 0f));
            Assert.AreEqual(2, buffer.Count);
        }

        [Test]
        public void Add_OverCapacity_StaysAtCapacity()
        {
            var buffer = new GazeRingBuffer(3);
            for (int i = 0; i < 10; i++)
                buffer.Add(MakeSample(i * 0.01f, 0f));

            Assert.AreEqual(3, buffer.Count, "Count bør aldrig overstige kapacitet");
        }

        [Test]
        public void GetNewest_ReturnsLastAdded()
        {
            var buffer = new GazeRingBuffer(5);
            buffer.Add(MakeSample(1.0f, 0.5f));
            buffer.Add(MakeSample(2.0f, 1.0f));
            buffer.Add(MakeSample(3.0f, 1.5f));

            var newest = buffer.GetNewest();
            Assert.AreEqual(3.0f, newest.TimestampSec, 0.001f);
            Assert.AreEqual(1.5f, newest.DeviationDeg, 0.001f);
        }

        [Test]
        public void Clear_ResetsCount()
        {
            var buffer = new GazeRingBuffer(5);
            buffer.Add(MakeSample(1.0f, 0f));
            buffer.Add(MakeSample(2.0f, 0f));
            buffer.Clear();

            Assert.AreEqual(0, buffer.Count);
        }

        // ─── GetSamplesInWindow ──────────────────────────────────────────

        [Test]
        public void GetSamplesInWindow_ReturnsOnlyRecentSamples()
        {
            var buffer = new GazeRingBuffer(20);

            // Simulér 90Hz samples over 300ms
            for (int i = 0; i < 27; i++)
            {
                float t = i * (1f / 90f); // ~0.011s per sample
                buffer.Add(MakeSample(t, 0.5f));
            }

            // Hent samples fra seneste 200ms
            var output = new GazeSample[20];
            int count = buffer.GetSamplesInWindow(200f, output);

            // 200ms ved 90Hz ≈ 18 samples
            Assert.Greater(count, 15, "Bør have 15+ samples i 200ms vindue");
            Assert.LessOrEqual(count, 20, "Bør ikke overstige output-array størrelse");
        }

        [Test]
        public void GetSamplesInWindow_EmptyBuffer_ReturnsZero()
        {
            var buffer = new GazeRingBuffer(10);
            var output = new GazeSample[10];
            int count = buffer.GetSamplesInWindow(200f, output);

            Assert.AreEqual(0, count);
        }

        [Test]
        public void GetSamplesInWindow_NullOutput_ReturnsZero()
        {
            var buffer = new GazeRingBuffer(5);
            buffer.Add(MakeSample(1.0f, 0f));

            int count = buffer.GetSamplesInWindow(200f, null);
            Assert.AreEqual(0, count);
        }

        // ─── EvaluateFixation ────────────────────────────────────────────

        [Test]
        public void EvaluateFixation_AllStable_ReturnsStable()
        {
            var buffer = new GazeRingBuffer(20);

            // 18 samples med lille afvigelse (under 2° tærskel)
            for (int i = 0; i < 18; i++)
            {
                buffer.Add(MakeSample(i * 0.011f, 0.5f)); // 0.5° deviation
            }

            var result = buffer.EvaluateFixation(200f, 2.0f);

            Assert.IsTrue(result.IsStable, "Alle samples under tærskel → stabil");
            Assert.AreEqual(0.5f, result.MeanDeviationDeg, 0.01f);
            Assert.AreEqual(0.5f, result.MaxDeviationDeg, 0.01f);
            Assert.Greater(result.SampleCount, 0);
        }

        [Test]
        public void EvaluateFixation_OneUnstable_ReturnsUnstable()
        {
            var buffer = new GazeRingBuffer(20);

            for (int i = 0; i < 17; i++)
                buffer.Add(MakeSample(i * 0.011f, 0.5f)); // Stabile

            buffer.Add(MakeSample(17 * 0.011f, 3.0f)); // Ustabil! Over 2° tærskel

            var result = buffer.EvaluateFixation(200f, 2.0f);

            Assert.IsFalse(result.IsStable,
                "Én sample over tærskel → hele præsentationen ugyldig");
            Assert.AreEqual(3.0f, result.MaxDeviationDeg, 0.01f);
        }

        [Test]
        public void EvaluateFixation_EmptyBuffer_ReturnsInvalid()
        {
            var buffer = new GazeRingBuffer(10);
            var result = buffer.EvaluateFixation(200f, 2.0f);

            Assert.IsFalse(result.IsStable);
            Assert.AreEqual(0, result.SampleCount);
        }

        [Test]
        public void EvaluateFixation_MeanDeviation_CalculatedCorrectly()
        {
            var buffer = new GazeRingBuffer(10);
            buffer.Add(MakeSample(0f, 1.0f));
            buffer.Add(MakeSample(0.011f, 2.0f));
            buffer.Add(MakeSample(0.022f, 3.0f));

            var result = buffer.EvaluateFixation(200f, 5.0f); // Høj tærskel → alle stabile

            Assert.AreEqual(2.0f, result.MeanDeviationDeg, 0.01f,
                "Mean af [1, 2, 3] = 2.0");
            Assert.AreEqual(3.0f, result.MaxDeviationDeg, 0.01f);
            Assert.AreEqual(3, result.SampleCount);
        }

        // ─── Ring buffer overflow ────────────────────────────────────────

        [Test]
        public void Overflow_OldSamplesAreOverwritten()
        {
            var buffer = new GazeRingBuffer(3); // Kun plads til 3

            buffer.Add(MakeSample(1.0f, 10f)); // Vil blive overskrevet
            buffer.Add(MakeSample(2.0f, 20f)); // Vil blive overskrevet
            buffer.Add(MakeSample(3.0f, 0.5f));
            buffer.Add(MakeSample(4.0f, 0.5f));
            buffer.Add(MakeSample(5.0f, 0.5f));

            var result = buffer.EvaluateFixation(5000f, 2.0f); // Bredt vindue

            // De gamle ustabile samples (10°, 20°) bør være overskrevet
            Assert.IsTrue(result.IsStable,
                "Gamle ustabile samples bør være overskrevet af nye stabile");
        }

        // ─── Hjælpefunktioner ────────────────────────────────────────────

        private GazeSample MakeSample(float timestampSec, float deviationDeg)
        {
            return new GazeSample
            {
                TimestampSec = timestampSec,
                DirectionLocal = new UnityEngine.Vector3(0, 0, 1),
                DeviationDeg = deviationDeg,
                IsValid = true
            };
        }
    }
}
