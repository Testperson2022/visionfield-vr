using System;
using System.Collections.Generic;
using VisionField.Core.Models;

/// <summary>
/// Test-Retest Variabilitet Tracker
///
/// Beregner intra-test variabilitet (Short-term Fluctuation / STF)
/// ved at reteste 10 forudbestemte punkter under testen.
///
/// Ref: Walsh 2010, p.105 — "STF is the standard deviation of
/// repeated threshold of the 10 predefined locations"
///
/// Høj STF indikerer inkonsistente svar (træthed, uopmærksomhed).
/// </summary>
namespace VisionField.Core
{
    public class TestRetestTracker
    {
        // 10 forudbestemte punkter der retestes (spredt over feltet)
        private static readonly int[] RETEST_POINT_IDS = { 3, 6, 13, 15, 22, 25, 38, 41, 47, 49 };

        private readonly Dictionary<int, List<float>> _measurements;

        public TestRetestTracker()
        {
            _measurements = new Dictionary<int, List<float>>();
            foreach (int id in RETEST_POINT_IDS)
                _measurements[id] = new List<float>();
        }

        /// <summary>Skal dette punkt retestes?</summary>
        public bool ShouldRetest(int gridPointId)
        {
            return _measurements.ContainsKey(gridPointId) &&
                   _measurements[gridPointId].Count == 1; // Retestes kun én gang
        }

        /// <summary>Registrer tærskel-måling for et punkt.</summary>
        public void RecordThreshold(int gridPointId, float thresholdDb)
        {
            if (_measurements.ContainsKey(gridPointId))
                _measurements[gridPointId].Add(thresholdDb);
        }

        /// <summary>
        /// Beregn Short-term Fluctuation (STF) i dB.
        /// STF = sqrt(mean(variance per punkt))
        /// Typisk normal: 1-2 dB. Forhøjet: >3 dB.
        /// </summary>
        public float ComputeSTF()
        {
            float sumVariance = 0;
            int count = 0;

            foreach (var kvp in _measurements)
            {
                if (kvp.Value.Count >= 2)
                {
                    float diff = kvp.Value[1] - kvp.Value[0];
                    sumVariance += diff * diff;
                    count++;
                }
            }

            if (count == 0) return 0f;
            return (float)Math.Sqrt(sumVariance / count);
        }

        /// <summary>Er STF forhøjet (>3 dB)?</summary>
        public bool IsElevated => ComputeSTF() > 3.0f;

        /// <summary>Antal punkter med retest-data.</summary>
        public int RetestCount
        {
            get
            {
                int count = 0;
                foreach (var kvp in _measurements)
                    if (kvp.Value.Count >= 2) count++;
                return count;
            }
        }
    }
}
