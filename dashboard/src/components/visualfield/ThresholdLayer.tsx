/**
 * ThresholdLayer — Rå sensitivitetstal (dB) per punkt
 */
import { GridConfig, toSvgX, toSvgY } from "./GridLayer";

interface Point {
  gridPointId: number;
  x: number;
  y: number;
  isBlindSpot: boolean;
  thresholdDb: number;
}

interface Props {
  config: GridConfig;
  points: Point[];
  visible?: boolean;
  onPointHover?: (pointId: number | null) => void;
  onPointClick?: (pointId: number) => void;
}

export default function ThresholdLayer({ config: g, points, visible = true, onPointHover, onPointClick }: Props) {
  if (!visible) return null;

  return (
    <g className="threshold-layer">
      {points.map(pt => {
        const px = toSvgX(pt.x, g);
        const py = toSvgY(pt.y, g);

        if (pt.isBlindSpot) {
          return <text key={pt.gridPointId} x={px} y={py + 3} textAnchor="middle"
            fontSize={7} fill="#bbb">·</text>;
        }

        return (
          <text key={pt.gridPointId} x={px} y={py + 4} textAnchor="middle"
            fontSize={10} fill="#222" fontFamily="ui-monospace, monospace"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => onPointHover?.(pt.gridPointId)}
            onMouseLeave={() => onPointHover?.(null)}
            onClick={() => onPointClick?.(pt.gridPointId)}
          >
            {Math.round(pt.thresholdDb)}
          </text>
        );
      })}
    </g>
  );
}
