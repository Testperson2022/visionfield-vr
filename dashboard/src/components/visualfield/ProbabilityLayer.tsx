/**
 * ProbabilityLayer — Statistisk signifikans per punkt
 *
 * Viser probability-klasse som farvede firkanter:
 * normal = intet, p<5% = lys grå, p<2% = grå, p<1% = mørk, p<0.5% = sort
 */
import { GridConfig, toSvgX, toSvgY } from "./GridLayer";
import type { ProbabilityClass } from "../../../../shared/screening/types";

interface Point {
  gridPointId: number;
  x: number;
  y: number;
  isBlindSpot: boolean;
  totalDeviationProb: ProbabilityClass;
  patternDeviationProb: ProbabilityClass;
}

interface Props {
  config: GridConfig;
  points: Point[];
  mode: "total" | "pattern";
  visible?: boolean;
}

function probToFill(prob: ProbabilityClass): string | null {
  switch (prob) {
    case "p05": return "#111";
    case "p1": return "#555";
    case "p2": return "#999";
    case "p5": return "#ccc";
    default: return null;
  }
}

function probToLabel(prob: ProbabilityClass): string {
  switch (prob) {
    case "p05": return "<0.5%";
    case "p1": return "<1%";
    case "p2": return "<2%";
    case "p5": return "<5%";
    default: return "";
  }
}

export default function ProbabilityLayer({ config: g, points, mode, visible = true }: Props) {
  if (!visible) return null;
  const cellSize = g.scale * 4.5;

  return (
    <g className="probability-layer">
      {points.filter(p => !p.isBlindSpot).map(pt => {
        const px = toSvgX(pt.x, g);
        const py = toSvgY(pt.y, g);
        const prob = mode === "total" ? pt.totalDeviationProb : pt.patternDeviationProb;
        const fill = probToFill(prob);

        if (!fill) return (
          <rect key={pt.gridPointId} x={px - cellSize / 2} y={py - cellSize / 2}
            width={cellSize} height={cellSize} fill="#f5f5f5" stroke="#e5e7eb" strokeWidth={0.5} />
        );

        return (
          <rect key={pt.gridPointId} x={px - cellSize / 2} y={py - cellSize / 2}
            width={cellSize} height={cellSize} fill={fill} rx={1}>
            <title>{probToLabel(prob)}</title>
          </rect>
        );
      })}
    </g>
  );
}

export function ProbabilityLegend() {
  const items = [
    { fill: "#f5f5f5", label: "Normal", border: true },
    { fill: "#ccc", label: "p < 5%" },
    { fill: "#999", label: "p < 2%" },
    { fill: "#555", label: "p < 1%" },
    { fill: "#111", label: "p < 0.5%" },
  ];

  return (
    <div className="flex gap-3 text-[9px] text-gray-500 justify-center mt-1">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 inline-block"
            style={{ background: item.fill, border: item.border ? "1px solid #ddd" : "none" }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
