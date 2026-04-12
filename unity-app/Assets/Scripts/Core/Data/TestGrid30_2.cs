using VisionField.Core.Models;

/// <summary>
/// 30-2 Testgrid — 76 punkter
/// Større felt end 24-2 (6° spacing, op til 30° ekcentricitet).
/// Bruges til neuro-oftalmologi og slag-patienter.
/// </summary>
namespace VisionField.Core.Data
{
    public static class TestGrid30_2
    {
        public static readonly GridPoint[] Grid;

        static TestGrid30_2()
        {
            var points = new System.Collections.Generic.List<GridPoint>();
            int id = 0;

            // 30-2: alle punkter inden for 30° med 6° spacing
            // Y-rækker: -27, -21, -15, -9, -3, 3, 9, 15, 21, 27
            int[] yValues = { -27, -21, -15, -9, -3, 3, 9, 15, 21, 27 };

            foreach (int y in yValues)
            {
                // Antal x-kolonner afhænger af y (cirkulært felt)
                float maxX = 30f;
                for (int x = -27; x <= 27; x += 6)
                {
                    float dist = (float)System.Math.Sqrt(x * x + y * y);
                    if (dist <= 32f) // Inden for 30° felt med margin
                    {
                        bool isBlindSpot = (x == 15 && y == -3) || (x == 15 && y == 3);
                        float norm = 32f - dist * 0.3f;
                        float sd = 1.8f + dist * 0.04f;
                        points.Add(new GridPoint(id++, x, y, isBlindSpot,
                            isBlindSpot ? 0f : norm,
                            isBlindSpot ? 0f : sd));
                    }
                }
            }

            Grid = points.ToArray();
        }

        public static int PointCount => Grid.Length;
    }
}
