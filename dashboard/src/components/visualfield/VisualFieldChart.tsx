/**
 * VisualFieldChart — Samlet interaktiv SVG synsfeltskort
 *
 * Lagdelt arkitektur:
 * - GridLayer (akser, fiksation)
 * - ThresholdLayer (rå dB tal)
 * - DeviationLayer (afvigelse med farvekode)
 * - ProbabilityLayer (statistisk signifikans)
 * - ClusterOverlay (sammenhængende defekter)
 *
 * Bruger kan skifte mellem lag via tabs.
 * Touch- og klik-venlig til tablet.
 *
 * Ref: Krav D fra opgavebeskrivelsen
 */
import { useState } from "react";
import GridLayer, { createGridConfig } from "./GridLayer";
import ThresholdLayer from "./ThresholdLayer";
import DeviationLayer from "./DeviationLayer";
import ProbabilityLayer, { ProbabilityLegend } from "./ProbabilityLayer";
import ClusterOverlay from "./ClusterOverlay";
import type { ScreeningResult, AnalyzedPoint, Cluster } from "../../screening/types";

type ViewMode = "threshold" | "td_deviation" | "pd_deviation" | "td_probability" | "pd_probability";

interface Props {
  result: ScreeningResult;
  eye: "OD" | "OS";
}

const VIEW_TABS: Array<{ mode: ViewMode; label: string; short: string }> = [
  { mode: "threshold", label: "Sensitivitet (dB)", short: "dB" },
  { mode: "td_deviation", label: "Total Deviation", short: "TD" },
  { mode: "pd_deviation", label: "Pattern Deviation", short: "PD" },
  { mode: "td_probability", label: "TD Probability", short: "TD-P" },
  { mode: "pd_probability", label: "PD Probability", short: "PD-P" },
];

export default function VisualFieldChart({ result, eye }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("threshold");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [showClusters, setShowClusters] = useState(true);

  const g = createGridConfig(400, 360);
  const hoveredData = hoveredPoint !== null
    ? result.points.find(p => p.gridPointId === hoveredPoint)
    : null;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="font-semibold text-gray-900 text-sm">
          {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
        </h3>

        {/* View mode tabs — responsivt */}
        <div className="flex gap-1 flex-wrap">
          {VIEW_TABS.map(tab => (
            <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                viewMode === tab.mode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              title={tab.label}
            >
              {tab.short}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart */}
      <svg width={g.width} height={g.height}
        viewBox={`0 0 ${g.width} ${g.height}`}
        className="block mx-auto touch-none"
        style={{ fontFamily: "ui-monospace, monospace", maxWidth: "100%" }}
      >
        <GridLayer config={g} />

        {/* Cluster overlay (altid under data-lag) */}
        <ClusterOverlay config={g} clusters={result.clusters}
          allPoints={result.points} visible={showClusters} />

        {/* Aktive data-lag */}
        {viewMode === "threshold" && (
          <ThresholdLayer config={g} points={result.points}
            onPointHover={setHoveredPoint} />
        )}
        {viewMode === "td_deviation" && (
          <DeviationLayer config={g} points={result.points} mode="total" />
        )}
        {viewMode === "pd_deviation" && (
          <DeviationLayer config={g} points={result.points} mode="pattern" />
        )}
        {viewMode === "td_probability" && (
          <ProbabilityLayer config={g} points={result.points} mode="total" />
        )}
        {viewMode === "pd_probability" && (
          <ProbabilityLayer config={g} points={result.points} mode="pattern" />
        )}
      </svg>

      {/* Probability legende */}
      {(viewMode === "td_probability" || viewMode === "pd_probability") && (
        <ProbabilityLegend />
      )}

      {/* Cluster toggle */}
      {result.clusters.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-gray-500 mt-2 justify-center cursor-pointer">
          <input type="checkbox" checked={showClusters}
            onChange={e => setShowClusters(e.target.checked)}
            className="rounded text-blue-600" />
          Vis klynge-markering ({result.clusters.length} cluster{result.clusters.length > 1 ? "s" : ""})
        </label>
      )}

      {/* Tooltip */}
      {hoveredData && (
        <div className="text-center text-xs text-gray-600 mt-2 bg-gray-50 rounded p-2">
          Punkt {hoveredData.gridPointId}: {hoveredData.thresholdDb.toFixed(1)} dB
          · Norm: {hoveredData.normativeDb.toFixed(1)} dB
          · TD: {hoveredData.totalDeviationDb.toFixed(1)} dB
          · PD: {hoveredData.patternDeviationDb.toFixed(1)} dB
          · {hoveredData.totalDeviationProb !== "normal" ? `Signifikant (${hoveredData.totalDeviationProb})` : "Normal"}
          {hoveredData.inCluster ? " · I KLYNGE" : ""}
        </div>
      )}
    </div>
  );
}
