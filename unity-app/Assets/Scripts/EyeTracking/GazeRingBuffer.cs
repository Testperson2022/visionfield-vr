using VisionField.Core;

/// <summary>
/// GC-fri ring buffer til gaze-samples under VR-test.
///
/// Pre-allokerer plads til ~200ms ved 90Hz (18 samples) + margin.
/// Undgår heap-allokering i hot path for at forhindre frame drops.
///
/// Design: Fast-size cirkulær buffer med tidstempel-filtrering.
/// </summary>
namespace VisionField.EyeTracking
{
    public class GazeRingBuffer
    {
        private readonly GazeSample[] _buffer;
        private readonly int _capacity;
        private int _head;  // Næste skrive-position
        private int _count; // Antal aktive elementer

        /// <summary>Antal samples i bufferen.</summary>
        public int Count => _count;

        /// <summary>Bufferens kapacitet.</summary>
        public int Capacity => _capacity;

        /// <param name="capacity">
        /// Max antal samples. Standard: 30 (>200ms ved 90Hz med margin).
        /// </param>
        public GazeRingBuffer(int capacity = 30)
        {
            _capacity = capacity;
            _buffer = new GazeSample[capacity];
            _head = 0;
            _count = 0;
        }

        /// <summary>Tilføj et gaze-sample. Overskriver ældste hvis fuld.</summary>
        public void Add(GazeSample sample)
        {
            _buffer[_head] = sample;
            _head = (_head + 1) % _capacity;
            if (_count < _capacity)
                _count++;
        }

        /// <summary>
        /// Hent samples inden for et tidsvindue (fra nyeste og bagud).
        /// Skriver til pre-allokeret output-array for at undgå GC.
        /// </summary>
        /// <param name="windowMs">Tidsvindue i millisekunder</param>
        /// <param name="output">Pre-allokeret output-array</param>
        /// <returns>Antal samples kopieret til output</returns>
        public int GetSamplesInWindow(float windowMs, GazeSample[] output)
        {
            if (_count == 0 || output == null || output.Length == 0)
                return 0;

            float windowSec = windowMs / 1000f;
            float newestTimestamp = GetNewest().TimestampSec;
            float cutoff = newestTimestamp - windowSec;

            int written = 0;
            int maxOutput = output.Length;

            // Iterér fra nyeste til ældste
            for (int i = 0; i < _count && written < maxOutput; i++)
            {
                int index = ((_head - 1 - i) % _capacity + _capacity) % _capacity;
                var sample = _buffer[index];

                if (sample.TimestampSec >= cutoff)
                {
                    output[written++] = sample;
                }
                else
                {
                    break; // Ældre samples er uden for vinduet
                }
            }

            return written;
        }

        /// <summary>Hent det nyeste sample.</summary>
        public GazeSample GetNewest()
        {
            if (_count == 0)
                return default;
            int index = ((_head - 1) % _capacity + _capacity) % _capacity;
            return _buffer[index];
        }

        /// <summary>Ryd bufferen (nulstil uden deallokering).</summary>
        public void Clear()
        {
            _head = 0;
            _count = 0;
            // Buffer-arrayet genbruges — ingen GC
        }

        /// <summary>
        /// Evaluer fiksationsstabilitet for samples i et tidsvindue.
        /// </summary>
        /// <param name="windowMs">Tidsvindue (typisk 200ms = stimulusvarighed)</param>
        /// <param name="thresholdDeg">Max afvigelse for stabil fiksation</param>
        public FixationResult EvaluateFixation(float windowMs, float thresholdDeg)
        {
            // Pre-allokeret scratch buffer — undgår GC
            // 200ms ved 90Hz = 18 samples, men vi allokerer buffer-størrelse for sikkerhed
            var scratch = new GazeSample[_capacity];
            int sampleCount = GetSamplesInWindow(windowMs, scratch);

            if (sampleCount == 0)
                return FixationResult.Invalid;

            float sumDeviation = 0f;
            float maxDeviation = 0f;
            bool allStable = true;

            for (int i = 0; i < sampleCount; i++)
            {
                float dev = scratch[i].DeviationDeg;
                sumDeviation += dev;
                if (dev > maxDeviation) maxDeviation = dev;
                if (dev > thresholdDeg) allStable = false;
            }

            float meanDeviation = sumDeviation / sampleCount;

            return new FixationResult(
                isStable: allStable,
                meanDeviationDeg: meanDeviation,
                maxDeviationDeg: maxDeviation,
                sampleCount: sampleCount);
        }
    }
}
