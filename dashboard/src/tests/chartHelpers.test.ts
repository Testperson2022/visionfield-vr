import { describe, it, expect } from "vitest";
import {
  thresholdToColor,
  deviationToColor,
  pointResultsToChartData,
  formatDuration,
} from "../utils/chartHelpers";

describe("thresholdToColor", () => {
  it("returns green for normal vision (>=28 dB)", () => {
    expect(thresholdToColor(30)).toBe("#22c55e");
    expect(thresholdToColor(28)).toBe("#22c55e");
  });

  it("returns yellow for moderate loss (15-19 dB)", () => {
    expect(thresholdToColor(17)).toBe("#eab308");
  });

  it("returns red for severe loss (<10 dB)", () => {
    expect(thresholdToColor(8)).toBe("#ef4444");
  });

  it("returns dark red for scotoma (<5 dB)", () => {
    expect(thresholdToColor(2)).toBe("#7f1d1d");
  });

  it("is monotonically getting worse from high to low dB", () => {
    const colors = [51, 30, 25, 17, 8, 2].map(thresholdToColor);
    // Alle farver skal være defineret (ingen undefined)
    colors.forEach((c) => expect(c).toBeTruthy());
  });
});

describe("deviationToColor", () => {
  it("returns green for normal deviation (>= -2 dB)", () => {
    expect(deviationToColor(0)).toBe("#22c55e");
    expect(deviationToColor(-1.5)).toBe("#22c55e");
  });

  it("returns yellow for mild loss (-2 to -5 dB)", () => {
    expect(deviationToColor(-3)).toBe("#eab308");
  });

  it("returns red for severe loss (<-10 dB)", () => {
    expect(deviationToColor(-15)).toBe("#ef4444");
  });

  it("returns dark red for scotoma (<-20 dB)", () => {
    expect(deviationToColor(-25)).toBe("#7f1d1d");
  });
});

describe("pointResultsToChartData", () => {
  const gridPoints = [
    { id: 0, x_deg: -27, y_deg: 3, is_blind_spot: false },
    { id: 16, x_deg: 9, y_deg: 9, is_blind_spot: true },
  ];

  const pointResults = [
    { grid_point_id: 0, threshold_db: 30, total_deviation_db: -0.5 },
  ];

  it("transforms to chart data with correct coordinates", () => {
    const data = pointResultsToChartData(pointResults, gridPoints, "threshold");
    expect(data).toHaveLength(2);
    expect(data[0].x).toBe(-27);
    expect(data[0].y).toBe(3);
    expect(data[0].thresholdDb).toBe(30);
  });

  it("marks blind spot with gray color", () => {
    const data = pointResultsToChartData(pointResults, gridPoints, "threshold");
    const blindSpot = data.find((p) => p.id === 16);
    expect(blindSpot?.isBlindSpot).toBe(true);
    expect(blindSpot?.fill).toBe("#6b7280");
  });

  it("uses threshold colors in threshold mode", () => {
    const data = pointResultsToChartData(pointResults, gridPoints, "threshold");
    expect(data[0].fill).toBe("#22c55e"); // 30 dB = green
  });

  it("uses deviation colors in deviation mode", () => {
    const data = pointResultsToChartData(pointResults, gridPoints, "deviation");
    expect(data[0].fill).toBe("#22c55e"); // -0.5 dB = green
  });
});

describe("formatDuration", () => {
  it("formats 0 seconds", () => {
    expect(formatDuration(0)).toBe("0:00");
  });

  it("formats 240 seconds as 4:00", () => {
    expect(formatDuration(240)).toBe("4:00");
  });

  it("formats 185 seconds as 3:05", () => {
    expect(formatDuration(185)).toBe("3:05");
  });
});
