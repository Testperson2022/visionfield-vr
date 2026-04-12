using System;
using VisionField.Core.Models;

/// <summary>
/// Alderskorrigeret Normativ Database
///
/// Justerer normative tærskler baseret på patientens alder.
/// Sensitivitet falder med ~0.6-1.0 dB per dekade efter 20 år.
///
/// Ref: Heijl A, Lindgren G, Olsson J. "Normal variability of
/// static perimetric threshold values across the central visual field."
/// Arch Ophthalmol. 1987;105:1544-1549.
///
/// Ref: Walsh 2010, p.126 — "age-matched normal values"
/// </summary>
namespace VisionField.Core.Data
{
    public static class NormativeDatabase
    {
        /// <summary>
        /// Sensitivitetstab per år efter 20 år (dB/år).
        /// Central: ~0.06 dB/år, Perifert: ~0.08 dB/år
        /// Ref: Heijl 1987
        /// </summary>
        private const float CENTRAL_LOSS_PER_YEAR = 0.06f;
        private const float PERIPHERAL_LOSS_PER_YEAR = 0.08f;
        private const int REFERENCE_AGE = 50; // Normativ data i testGrid er for ~50 år

        /// <summary>
        /// Hent alderskorrigeret normativ tærskel for et punkt.
        /// </summary>
        /// <param name="baseThresholdDb">Basis normativ (fra testGrid, ~50 år)</param>
        /// <param name="eccentricityDeg">Afstand fra fiksation (grader)</param>
        /// <param name="patientAge">Patientens alder (år)</param>
        public static float GetAgeAdjustedThreshold(float baseThresholdDb, float eccentricityDeg, int patientAge)
        {
            float ageDiff = patientAge - REFERENCE_AGE;

            // Interpolér tab-rate baseret på excentricitet
            float lossPerYear;
            if (eccentricityDeg <= 10f)
                lossPerYear = CENTRAL_LOSS_PER_YEAR;
            else if (eccentricityDeg >= 25f)
                lossPerYear = PERIPHERAL_LOSS_PER_YEAR;
            else
                lossPerYear = CENTRAL_LOSS_PER_YEAR +
                    (PERIPHERAL_LOSS_PER_YEAR - CENTRAL_LOSS_PER_YEAR) *
                    (eccentricityDeg - 10f) / 15f;

            float adjustment = ageDiff * lossPerYear;
            return Math.Max(0f, baseThresholdDb - adjustment);
        }

        /// <summary>
        /// Hent alderskorrigeret SD for et punkt.
        /// Variabilitet øges med alder (ca. +0.01 dB/år).
        /// </summary>
        public static float GetAgeAdjustedSD(float baseSdDb, int patientAge)
        {
            float ageDiff = Math.Max(0, patientAge - REFERENCE_AGE);
            return baseSdDb + ageDiff * 0.01f;
        }

        /// <summary>
        /// Opret alderskorrigerede GridPoints fra 24-2 grid.
        /// </summary>
        public static GridPoint[] GetAgeAdjustedGrid(int patientAge)
        {
            var baseGrid = TestGrid24_2.Grid;
            var adjusted = new GridPoint[baseGrid.Length];

            for (int i = 0; i < baseGrid.Length; i++)
            {
                var bp = baseGrid[i];
                if (bp.IsBlindSpot)
                {
                    adjusted[i] = bp;
                    continue;
                }

                float eccentricity = (float)Math.Sqrt(bp.XDeg * bp.XDeg + bp.YDeg * bp.YDeg);
                float adjThreshold = GetAgeAdjustedThreshold(bp.NormativeThresholdDb, eccentricity, patientAge);
                float adjSD = GetAgeAdjustedSD(bp.NormativeSdDb, patientAge);

                adjusted[i] = new GridPoint(bp.Id, bp.XDeg, bp.YDeg, false, adjThreshold, adjSD);
            }

            return adjusted;
        }
    }
}
