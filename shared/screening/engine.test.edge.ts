/**
 * Edge Case Tests for Screening Engine
 * Ref: Krav J/K.10 — testcases for algoritmen
 */
import { runScreeningAnalysis } from "./engine";

describe("Edge Cases", () => {
  it("handles empty point results", () => {
    const result = runScreeningAnalysis([], { fpRate: 0, fnRate: 0, fixLossRate: 0, completionRate: 0 });
    expect(result.points).toHaveLength(0);
    expect(result.clusters).toHaveLength(0);
    expect(result.riskLevel).toBeDefined();
  });

  it("handles single point", () => {
    const result = runScreeningAnalysis(
      [{ grid_point_id: 0, threshold_db: 25, total_deviation_db: -2, x_deg: -27, y_deg: 3 }],
      { fpRate: 0, fnRate: 0, fixLossRate: 0, completionRate: 0.02 }
    );
    expect(result.points).toHaveLength(1);
    expect(result.clusters).toHaveLength(0);
  });

  it("handles all points at zero (total blindness)", () => {
    const points = Array.from({ length: 52 }, (_, i) => ({
      grid_point_id: i, threshold_db: 0, total_deviation_db: -30, x_deg: 0, y_deg: 0,
    }));
    const result = runScreeningAnalysis(points, { fpRate: 0, fnRate: 0, fixLossRate: 0, completionRate: 1 });
    expect(result.riskLevel).toBe("refer");
  });

  it("handles perfect normal vision", () => {
    const points = Array.from({ length: 52 }, (_, i) => ({
      grid_point_id: i, threshold_db: 30, total_deviation_db: 0, x_deg: 0, y_deg: 0,
    }));
    const result = runScreeningAnalysis(points, { fpRate: 0.02, fnRate: 0.05, fixLossRate: 0.03, completionRate: 1 });
    expect(result.riskLevel).toBe("normal");
    expect(result.recommendedAction).toBe("routine_followup");
  });

  it("handles 100% false positive rate", () => {
    const points = Array.from({ length: 10 }, (_, i) => ({
      grid_point_id: i, threshold_db: 20, total_deviation_db: -5, x_deg: 0, y_deg: 0,
    }));
    const result = runScreeningAnalysis(points, { fpRate: 1.0, fnRate: 0, fixLossRate: 0, completionRate: 1 });
    expect(result.reliability.grade).toBe("unreliable");
    expect(result.reliability.canInterpret).toBe(false);
  });

  it("handles blind spot points correctly", () => {
    const points = [
      { grid_point_id: 16, threshold_db: 0, total_deviation_db: 0, x_deg: 9, y_deg: 9, is_blind_spot: true },
      { grid_point_id: 15, threshold_db: 30, total_deviation_db: 0, x_deg: 3, y_deg: 9 },
    ];
    const result = runScreeningAnalysis(points, { fpRate: 0, fnRate: 0, fixLossRate: 0, completionRate: 1 });
    const bsPoint = result.points.find(p => p.gridPointId === 16);
    expect(bsPoint?.isBlindSpot).toBe(true);
  });
});
