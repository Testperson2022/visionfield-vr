using VisionField.Core.Models;

/// <summary>
/// Esterman Binokulært Synsfelt — 120 testpunkter
///
/// Binokulær suprathreshold-test til kørekortsvurdering.
/// Dækker 75° temporalt, 60° nasalt, 40° sup/inf.
/// Bruges med begge øjne åbne.
///
/// Ref: Esterman B. "Functional scoring of the binocular field"
/// Ophthalmology. 1982;89:1226-1234.
/// </summary>
namespace VisionField.Core.Data
{
    public static class TestGridEsterman
    {
        public static readonly GridPoint[] Grid;
        public const int TOTAL_POINTS = 120;
        public const float SUPRATHRESHOLD_DB = 10f; // Suprathreshold intensitet

        static TestGridEsterman()
        {
            var points = new System.Collections.Generic.List<GridPoint>();
            int id = 0;

            // Esterman grid: irregulært mønster, tættere centralt
            // Centrale 20°: 5° spacing
            for (int y = -20; y <= 20; y += 5)
            {
                for (int x = -60; x <= 75; x += 5)
                {
                    float dist = (float)System.Math.Sqrt(x * x + y * y);
                    if (dist <= 22f && points.Count < TOTAL_POINTS)
                    {
                        points.Add(new GridPoint(id++, x, y, false, 25f, 3f));
                    }
                }
            }

            // Perifere punkter: 10° spacing
            for (int y = -40; y <= 40; y += 10)
            {
                for (int x = -60; x <= 75; x += 10)
                {
                    float dist = (float)System.Math.Sqrt(x * x + y * y);
                    if (dist > 22f && dist <= 80f && points.Count < TOTAL_POINTS)
                    {
                        // Skip punkter der allerede er dækket centralt
                        bool exists = false;
                        foreach (var p in points)
                            if (System.Math.Abs(p.XDeg - x) < 3 && System.Math.Abs(p.YDeg - y) < 3)
                            { exists = true; break; }

                        if (!exists)
                            points.Add(new GridPoint(id++, x, y, false, 20f, 4f));
                    }
                }
            }

            Grid = points.ToArray();
        }

        /// <summary>
        /// Esterman Efficiency Score: antal set / total * 100.
        /// Kørekort kræver typisk ≥ 70%.
        /// </summary>
        public static float ComputeEfficiencyScore(bool[] responses)
        {
            if (responses == null || responses.Length == 0) return 0f;
            int seen = 0;
            foreach (bool r in responses) if (r) seen++;
            return (float)seen / responses.Length * 100f;
        }
    }
}
