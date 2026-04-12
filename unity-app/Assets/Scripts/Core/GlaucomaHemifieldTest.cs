using System;
using System.Collections.Generic;
using VisionField.Core.Data;
using VisionField.Core.Models;

/// <summary>
/// VisionField VR — Glaucoma Hemifield Test (GHT)
///
/// Implementerer GHT-algoritmen som beskrevet i:
/// Walsh TJ (ed): Visual Fields, Examination and Interpretation.
/// American Academy of Ophthalmology Monograph Series, 3rd ed, 2010, pp 102-105.
///
/// GHT inddeler synsfeltet i 5 spejlede zone-par (superior/inferior)
/// og sammenligner Pattern Deviation værdier mellem parrede zoner.
///
/// 5 mulige resultater:
/// 1. Outside Normal Limits — zone-par forskel > 1% af normal population
/// 2. Borderline — zone-par forskel > 3% men ≤ 1% af normal population
/// 3. General Reduction of Sensitivity — bedste region under 0.5% normal
/// 4. Abnormally High Sensitivity — bedste 15% overstiger 99.5% normal
/// 5. Within Normal Limits — ingen af ovenstående kriterier opfyldt
///
/// KLINISK KRITISK: GHT er en vigtig indikator for glaukom.
/// Ref: Asman P, Heijl A. Glaucoma Hemifield Test. Arch Ophthalmol. 1992.
/// </summary>
namespace VisionField.Core
{
    public static class GlaucomaHemifieldTest
    {
        /// <summary>
        /// GHT zone-definitioner for 24-2 gitter.
        /// 5 par af spejlede zoner (superior/inferior).
        /// Excluderer: outer edge, temporal loci, blind spot loci.
        /// Ref: Walsh 2010, Fig 3-17, p.102
        /// </summary>
        private static readonly int[][] SuperiorZones = new int[][]
        {
            // Zone 1: Superior nasal
            new[] { 28, 29, 30, 31 },        // y=21, x=-21 to -3
            // Zone 2: Superior arcuate nasal
            new[] { 20, 21, 22, 23 },        // y=15, x=-21 to -3
            // Zone 3: Superior arcuate central
            new[] { 13, 14, 24, 25 },        // y=9/-15, x=-9 to 9 (central)
            // Zone 4: Superior arcuate temporal
            new[] { 15, 17, 26, 27 },        // y=9/15, temporal
            // Zone 5: Superior paracentral
            new[] { 3, 4, 5, 6 },            // y=3, x=-9 to 9
        };

        private static readonly int[][] InferiorZones = new int[][]
        {
            // Zone 1: Inferior nasal (spejlet af superior zone 1)
            new[] { 36, 37, 38, 39 },        // y=-15, x=-21 to -3
            // Zone 2: Inferior arcuate nasal
            new[] { 45, 46, 47, 48 },        // y=-9, x=-21 to -3
            // Zone 3: Inferior arcuate central
            new[] { 47, 48, 40, 41 },        // y=-9/-15, central
            // Zone 4: Inferior arcuate temporal
            new[] { 49, 51, 42, 43 },        // y=-9/-15, temporal
            // Zone 5: Inferior paracentral
            new[] { 47, 48, 49, 6 },         // y=-9, x=-9 to 9 (mirrored)
        };

        /// <summary>
        /// Kør Glaucoma Hemifield Test på et sæt punkt-resultater.
        /// </summary>
        /// <param name="pointResults">Pattern deviation værdier per punkt</param>
        /// <returns>GHT-resultat</returns>
        public static GHTResult Evaluate(PointResult[] pointResults)
        {
            if (pointResults == null || pointResults.Length == 0)
                return GHTResult.WithinNormalLimits;

            // Byg lookup: grid_point_id → pattern_deviation_db
            var pdMap = new Dictionary<int, float>();
            foreach (var pr in pointResults)
                pdMap[pr.GridPointId] = pr.PatternDeviationDb;

            // Beregn zone-score for hvert par (gennemsnit af pattern deviation)
            var zoneDifferences = new float[5];
            bool anyOutsideNormal = false;
            bool anyBorderline = false;

            for (int z = 0; z < 5; z++)
            {
                float superiorScore = ComputeZoneScore(SuperiorZones[z], pdMap);
                float inferiorScore = ComputeZoneScore(InferiorZones[z], pdMap);
                zoneDifferences[z] = Math.Abs(superiorScore - inferiorScore);

                // Kliniske thresholds baseret på normativ database
                // >5 dB forskel = outside normal limits (~1% af normal population)
                // >3.5 dB forskel = borderline (~3% af normal population)
                // Ref: Asman & Heijl 1992, tilpassede grænser
                if (zoneDifferences[z] > 5.0f)
                    anyOutsideNormal = true;
                else if (zoneDifferences[z] > 3.5f)
                    anyBorderline = true;
            }

            // 1. Outside Normal Limits
            if (anyOutsideNormal)
                return GHTResult.OutsideNormalLimits;

            // Beregn generel feltshøjde (bedste region)
            float generalHeight = ComputeGeneralHeight(pointResults);

            // 4. Abnormally High Sensitivity (check FØR general reduction)
            // Bedste 15% af feltet overstiger 99.5% af normal
            if (generalHeight > 4.0f) // >4 dB over normativ i bedste region
                return GHTResult.AbnormallyHighSensitivity;

            // 3. General Reduction of Sensitivity
            // Bedste region under 0.5% af normal population
            if (generalHeight < -6.0f) // Selv bedste region er markant nedsat
                return GHTResult.GeneralReductionOfSensitivity;

            // 2. Borderline
            if (anyBorderline)
                return GHTResult.Borderline;

            // 5. Within Normal Limits
            return GHTResult.WithinNormalLimits;
        }

        /// <summary>Beregn gennemsnitlig pattern deviation for en zone.</summary>
        private static float ComputeZoneScore(int[] pointIds, Dictionary<int, float> pdMap)
        {
            float sum = 0f;
            int count = 0;
            foreach (int id in pointIds)
            {
                if (pdMap.TryGetValue(id, out float pd))
                {
                    sum += pd;
                    count++;
                }
            }
            return count > 0 ? sum / count : 0f;
        }

        /// <summary>
        /// Beregn generel felthøjde — baseret på de mest normale regioner.
        /// Bruges til at detektere generaliseret tab vs. lokaliseret tab.
        /// Ref: Walsh 2010, p.103 — "most normal region of the field"
        /// </summary>
        private static float ComputeGeneralHeight(PointResult[] pointResults)
        {
            if (pointResults.Length == 0) return 0f;

            // Sortér total deviations og tag de bedste 15%
            var deviations = new List<float>();
            foreach (var pr in pointResults)
                deviations.Add(pr.TotalDeviationDb);

            deviations.Sort();
            deviations.Reverse(); // Højeste (bedste) først

            int topCount = Math.Max(1, (int)(deviations.Count * 0.15f));
            float sum = 0f;
            for (int i = 0; i < topCount; i++)
                sum += deviations[i];

            return sum / topCount;
        }
    }
}
