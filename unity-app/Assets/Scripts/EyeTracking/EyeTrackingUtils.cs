using System;
using UnityEngine;
using VisionField.Core;

/// <summary>
/// VisionField VR — Eye Tracking Utilities
///
/// Statiske hjælpefunktioner til koordinatkonvertering og fiksationsvurdering.
/// Pure C# — testbar i EditMode uden runtime-afhængigheder.
///
/// KLINISK KRITISK:
/// Ref: lessons.md [2025-01] — Alle eye tracking koordinater SKAL konverteres
/// til lokal headspace via ToLocalSpace(). ALDRIG brug rå API-koordinater.
/// </summary>
namespace VisionField.EyeTracking
{
    public static class EyeTrackingUtils
    {
        /// <summary>
        /// Konvertér rå gaze-retning fra Meta Eye Tracking SDK til lokal headspace.
        ///
        /// KRITISK: Denne funktion SKAL bruges for alle gaze-data.
        /// Rå SDK-koordinater må ALDRIG bruges direkte i stimulus-logik.
        /// Ref: lessons.md — Meta XR SDK opdateringer kan ændre koordinatsystem.
        /// </summary>
        /// <param name="rawGazeWorld">Rå gaze-retning i world space fra SDK</param>
        /// <param name="headPosition">Head transform position</param>
        /// <param name="headRotation">Head transform rotation</param>
        /// <returns>Gaze-retning i lokal headspace (normaliseret)</returns>
        public static Vector3 ToLocalSpace(Vector3 rawGazeWorld,
            Vector3 headPosition, Quaternion headRotation)
        {
            // Konvertér world-space gaze til head-lokal retning
            // InverseTransformDirection: world → local
            Quaternion inverseRotation = Quaternion.Inverse(headRotation);
            Vector3 local = inverseRotation * rawGazeWorld;
            return Vector3.Normalize(local);
        }

        /// <summary>
        /// Beregn vinkelafvigelse mellem to retningsvektorer i grader.
        /// Bruges til at måle afstand mellem gaze og fiksationspunkt.
        /// </summary>
        /// <param name="gazeDirectionLocal">Gaze-retning i lokal headspace</param>
        /// <param name="fixationDirectionLocal">Fiksationspunktets retning i lokal headspace</param>
        /// <returns>Afvigelse i grader (0° = perfekt fiksation)</returns>
        public static float CalculateDeviationDeg(Vector3 gazeDirectionLocal,
            Vector3 fixationDirectionLocal)
        {
            // Undgå numeriske problemer med nul-vektorer
            float gazeMag = Magnitude(gazeDirectionLocal);
            float fixMag = Magnitude(fixationDirectionLocal);
            if (gazeMag < 1e-6f || fixMag < 1e-6f)
                return float.MaxValue;

            // Normalisér
            Vector3 gazeNorm = Normalize(gazeDirectionLocal);
            Vector3 fixNorm = Normalize(fixationDirectionLocal);

            // Dot product → vinkel
            float dot = Dot(gazeNorm, fixNorm);
            // Clamp for numerisk stabilitet (acos kræver [-1, 1])
            dot = Mathf.Clamp(dot, -1f, 1f);
            float angleRad = (float)Math.Acos(dot);
            return angleRad * (180f / (float)Math.PI);
        }

        /// <summary>
        /// Check om fiksation er stabil (afvigelse under tærskel).
        /// </summary>
        public static bool IsFixationStable(float deviationDeg, float thresholdDeg)
        {
            return deviationDeg <= thresholdDeg;
        }

        /// <summary>
        /// Check om fiksation er stabil med standard klinisk tærskel.
        /// </summary>
        public static bool IsFixationStable(float deviationDeg)
        {
            return IsFixationStable(deviationDeg, ClinicalConstants.FIXATION_THRESHOLD_DEG);
        }

        // ─── Vektor-hjælpefunktioner (undgår afhængighed af Unity runtime) ──

        private static float Magnitude(Vector3 v)
        {
            return (float)Math.Sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        }

        private static Vector3 Normalize(Vector3 v)
        {
            float mag = Magnitude(v);
            if (mag < 1e-6f) return new Vector3(0, 0, 0);
            return new Vector3(v.x / mag, v.y / mag, v.z / mag);
        }

        private static float Dot(Vector3 a, Vector3 b)
        {
            return a.x * b.x + a.y * b.y + a.z * b.z;
        }
    }
}
