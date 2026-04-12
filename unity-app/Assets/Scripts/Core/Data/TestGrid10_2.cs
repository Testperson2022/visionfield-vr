using VisionField.Core.Models;

/// <summary>
/// 10-2 Testgrid — 68 punkter inden for centrale 10°.
/// Bruges til macula-fokuseret test (AMD, makulopati).
/// 2° spacing i stedet for 6°.
/// Ref: OPI — custom test grids
/// </summary>
namespace VisionField.Core.Data
{
    public static class TestGrid10_2
    {
        public static readonly GridPoint[] Grid;

        static TestGrid10_2()
        {
            var points = new System.Collections.Generic.List<GridPoint>();
            int id = 0;
            // 10-2: punkter ved -9, -7, -5, -3, -1, 1, 3, 5, 7, 9 grader (x og y)
            // Men kun inden for ~10° radius
            for (int yi = -9; yi <= 9; yi += 2)
            {
                for (int xi = -9; xi <= 9; xi += 2)
                {
                    float dist = (float)System.Math.Sqrt(xi * xi + yi * yi);
                    if (dist <= 10.5f)
                    {
                        // Normativ tærskel: højere centralt, lavere perifert
                        float normThreshold = 34.0f - dist * 0.3f;
                        float normSd = 1.5f + dist * 0.05f;
                        points.Add(new GridPoint(id++, xi, yi, false, normThreshold, normSd));
                    }
                }
            }
            Grid = points.ToArray();
        }

        public static int PointCount => Grid.Length;
    }
}
