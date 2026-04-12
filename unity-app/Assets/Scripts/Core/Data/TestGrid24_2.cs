using VisionField.Core.Models;

/// <summary>
/// VisionField VR — 24-2 Testgrid
///
/// Humphrey-kompatibelt 24-2 gitter med 54 testpunkter.
/// Koordinater: x positiv = temporal, y positiv = superior.
/// Kilde: Heijl et al. 1987 normative database.
///
/// KLINISK KRITISK: Disse koordinater og normative data må IKKE ændres
/// uden ny klinisk validering. Spejler shared/types/testGrid.ts.
/// </summary>
namespace VisionField.Core.Data
{
    public static class TestGrid24_2
    {
        public static readonly GridPoint[] Grid = new GridPoint[]
        {
            // Øverste halvdel (superior) — y = 3°
            new GridPoint(0,  -27f, 3f,  false, 24.0f, 3.2f),
            new GridPoint(1,  -21f, 3f,  false, 26.5f, 2.8f),
            new GridPoint(2,  -15f, 3f,  false, 28.0f, 2.5f),
            new GridPoint(3,  -9f,  3f,  false, 29.5f, 2.2f),
            new GridPoint(4,  -3f,  3f,  false, 30.5f, 2.0f),
            new GridPoint(5,   3f,  3f,  false, 30.5f, 2.0f),
            new GridPoint(6,   9f,  3f,  false, 29.5f, 2.2f),
            new GridPoint(7,  15f,  3f,  false, 28.0f, 2.5f),
            new GridPoint(8,  21f,  3f,  false, 26.0f, 2.8f),
            new GridPoint(9,  27f,  3f,  false, 24.0f, 3.2f),

            // y = 9°
            new GridPoint(10, -27f, 9f,  false, 24.5f, 3.0f),
            new GridPoint(11, -21f, 9f,  false, 27.0f, 2.7f),
            new GridPoint(12, -15f, 9f,  false, 28.5f, 2.4f),
            new GridPoint(13, -9f,  9f,  false, 30.0f, 2.1f),
            new GridPoint(14, -3f,  9f,  false, 31.0f, 1.9f),
            new GridPoint(15,  3f,  9f,  false, 31.0f, 1.9f),
            new GridPoint(16,  9f,  9f,  true,  0.0f,  0.0f),  // Blind spot (OD)
            new GridPoint(17, 15f,  9f,  false, 28.0f, 2.5f),
            new GridPoint(18, 21f,  9f,  false, 26.5f, 2.7f),
            new GridPoint(19, 27f,  9f,  false, 24.0f, 3.0f),

            // y = 15°
            new GridPoint(20, -21f, 15f, false, 27.5f, 2.6f),
            new GridPoint(21, -15f, 15f, false, 29.0f, 2.3f),
            new GridPoint(22, -9f,  15f, false, 30.5f, 2.0f),
            new GridPoint(23, -3f,  15f, false, 31.5f, 1.8f),
            new GridPoint(24,  3f,  15f, false, 31.5f, 1.8f),
            new GridPoint(25,  9f,  15f, false, 30.0f, 2.1f),
            new GridPoint(26, 15f,  15f, false, 28.5f, 2.4f),
            new GridPoint(27, 21f,  15f, false, 27.0f, 2.6f),

            // y = 21°
            new GridPoint(28, -21f, 21f, false, 28.0f, 2.5f),
            new GridPoint(29, -15f, 21f, false, 29.5f, 2.2f),
            new GridPoint(30, -9f,  21f, false, 31.0f, 1.9f),
            new GridPoint(31, -3f,  21f, false, 32.0f, 1.7f),

            // Nedre halvdel (inferior) — spejlet
            // y = -21°
            new GridPoint(32,  3f,  -21f, false, 32.0f, 1.7f),
            new GridPoint(33,  9f,  -21f, false, 31.0f, 1.9f),
            new GridPoint(34, 15f,  -21f, false, 29.5f, 2.2f),
            new GridPoint(35, 21f,  -21f, false, 28.0f, 2.5f),

            // y = -15°
            new GridPoint(36, -21f, -15f, false, 27.5f, 2.6f),
            new GridPoint(37, -15f, -15f, false, 29.0f, 2.3f),
            new GridPoint(38, -9f,  -15f, false, 30.5f, 2.0f),
            new GridPoint(39, -3f,  -15f, false, 31.5f, 1.8f),
            new GridPoint(40,  3f,  -15f, false, 31.5f, 1.8f),
            new GridPoint(41,  9f,  -15f, false, 30.0f, 2.1f),
            new GridPoint(42, 15f,  -15f, false, 28.5f, 2.4f),
            new GridPoint(43, 21f,  -15f, false, 27.0f, 2.6f),

            // y = -9°
            new GridPoint(44, -27f, -9f, false, 24.5f, 3.0f),
            new GridPoint(45, -21f, -9f, false, 27.0f, 2.7f),
            new GridPoint(46, -15f, -9f, false, 28.5f, 2.4f),
            new GridPoint(47, -9f,  -9f, false, 30.0f, 2.1f),
            new GridPoint(48, -3f,  -9f, false, 31.0f, 1.9f),
            new GridPoint(49,  3f,  -9f, false, 31.0f, 1.9f),
            new GridPoint(50,  9f,  -9f, true,  0.0f,  0.0f),  // Blind spot (OS)
            new GridPoint(51, 15f,  -9f, false, 28.0f, 2.5f),
            new GridPoint(52, 21f,  -9f, false, 26.5f, 2.7f),
            new GridPoint(53, 27f,  -9f, false, 24.0f, 3.0f),
        };

        /// <summary>
        /// Returnerer blind spot punkt-ID baseret på øje.
        /// OD (højre): punkt 16 ved (9°, 9°)
        /// OS (venstre): punkt 50 ved (9°, -9°)
        /// </summary>
        public static int GetBlindSpotPointId(Eye eye)
        {
            return eye == Eye.OD ? 16 : 50;
        }

        /// <summary>Returnerer alle punkter der IKKE er blind spot.</summary>
        public static GridPoint[] GetNonBlindSpotPoints()
        {
            var result = new System.Collections.Generic.List<GridPoint>(52);
            for (int i = 0; i < Grid.Length; i++)
            {
                if (!Grid[i].IsBlindSpot)
                    result.Add(Grid[i]);
            }
            return result.ToArray();
        }
    }
}
