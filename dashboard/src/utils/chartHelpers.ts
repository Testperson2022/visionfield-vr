/**
 * VisionField VR — Chart Helpers
 *
 * Transformerer PointResult[] til Recharts-data for synsfeltsvisualisering.
 * Farvekoder: dB-tærskel → klinisk farveskala.
 */

export interface VisualFieldPoint {
  id: number;
  x: number; // Grader fra fiksation (temporal positiv)
  y: number; // Grader fra fiksation (superior positiv)
  thresholdDb: number;
  deviationDb: number;
  isBlindSpot: boolean;
  fill: string;
}

/**
 * Konvertér dB-tærskel til farvekode.
 * Klinisk konvention: høj dB = god syn (grøn), lav dB = dårlig syn (rød).
 */
export function thresholdToColor(thresholdDb: number): string {
  if (thresholdDb >= 28) return "#22c55e"; // Grøn — normal
  if (thresholdDb >= 20) return "#84cc16"; // Lys grøn
  if (thresholdDb >= 15) return "#eab308"; // Gul
  if (thresholdDb >= 10) return "#f97316"; // Orange
  if (thresholdDb >= 5) return "#ef4444";  // Rød
  return "#7f1d1d";                         // Mørk rød — svært nedsat
}

/**
 * Konvertér total deviation til farvekode.
 * Negativ = dårligere end normativ.
 */
export function deviationToColor(deviationDb: number): string {
  if (deviationDb >= -2) return "#22c55e";  // Normal
  if (deviationDb >= -5) return "#eab308";  // Let nedsat
  if (deviationDb >= -10) return "#f97316"; // Moderat nedsat
  if (deviationDb >= -20) return "#ef4444"; // Svært nedsat
  return "#7f1d1d";                          // Absolut skotom
}

/**
 * Transformér PointResult[] til Recharts ScatterChart data.
 */
export function pointResultsToChartData(
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
  }>,
  gridPoints: Array<{
    id: number;
    x_deg: number;
    y_deg: number;
    is_blind_spot: boolean;
  }>,
  mode: "threshold" | "deviation" = "threshold"
): VisualFieldPoint[] {
  const resultMap = new Map(pointResults.map((p) => [p.grid_point_id, p]));

  return gridPoints.map((gp) => {
    const result = resultMap.get(gp.id);
    const thresholdDb = result?.threshold_db ?? 0;
    const deviationDb = result?.total_deviation_db ?? 0;

    return {
      id: gp.id,
      x: gp.x_deg,
      y: gp.y_deg,
      thresholdDb,
      deviationDb,
      isBlindSpot: gp.is_blind_spot,
      fill: gp.is_blind_spot
        ? "#6b7280"
        : mode === "threshold"
          ? thresholdToColor(thresholdDb)
          : deviationToColor(deviationDb),
    };
  });
}

/** Formatér sekunder til MM:SS. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
