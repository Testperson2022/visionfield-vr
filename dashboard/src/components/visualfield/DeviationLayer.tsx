/**
 * DeviationLayer — Afvigelse fra normativ (dB) med farvekode
 */
import { GridConfig, toSvgX, toSvgY } from "./GridLayer";

interface Point {
  gridPointId: number;
  x: number;
  y: number;
  isBlindSpot: boolean;
  totalDeviationDb: number;
  patternDeviationDb: number;
}

interface Props {
  config: GridConfig;
  points: Point[];
  mode: "total" | "pattern";
  visible?: boolean;
}

function deviationColor(dev: number): string {
  if (dev >= -2) return "#22c55e20"; // Grøn, transparent
  if (dev >= -5) return "#eab30840";
  if (dev >= -10) return "#f9731660";
  if (dev >= -20) return "#ef444480";
  return "#7f1d1da0";
}

export default function DeviationLayer({ config: g, points, mode, visible = true }: Props) {
  if (!visible) return null;
  const cellR = g.scale * 2.8;

  return (
    <g className="deviation-layer">
      {points.filter(p => !p.isBlindSpot).map(pt => {
        const px = toSvgX(pt.x, g);
        const py = toSvgY(pt.y, g);
        const dev = mode === "total" ? pt.totalDeviationDb : pt.patternDeviationDb;
        const color = deviationColor(dev);

        return (
          <g key={pt.gridPointId}>
            <rect x={px - cellR} y={py - cellR} width={cellR * 2} height={cellR * 2}
              fill={color} rx={2} />
            <text x={px} y={py + 4} textAnchor="middle"
              fontSize={9} fill={dev < -5 ? "#b91c1c" : "#374151"}
              fontFamily="ui-monospace, monospace">
              {Math.round(dev)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
