/**
 * GridLayer — Basis SVG grid med akser og testpunkt-positioner
 *
 * Nederste lag: akser, grad-markering, blind spot.
 * Alle andre lag placerer elementer relativt til dette grid.
 */

export interface GridConfig {
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  /** Pixels per grad */
  scale: number;
}

export function createGridConfig(width: number = 380, height: number = 340): GridConfig {
  return {
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    scale: Math.min(width, height) / 68, // 68° total range (-34 to +34)
  };
}

export function toSvgX(xDeg: number, g: GridConfig): number {
  return g.centerX + xDeg * g.scale;
}

export function toSvgY(yDeg: number, g: GridConfig): number {
  return g.centerY - yDeg * g.scale; // Y inverteret
}

interface Props {
  config: GridConfig;
  showAxisLabels?: boolean;
}

export default function GridLayer({ config: g, showAxisLabels = true }: Props) {
  return (
    <g className="grid-layer">
      {/* Akser */}
      <line x1={10} y1={g.centerY} x2={g.width - 10} y2={g.centerY}
        stroke="#ccc" strokeWidth={0.5} />
      <line x1={g.centerX} y1={10} x2={g.centerX} y2={g.height - 10}
        stroke="#ccc" strokeWidth={0.5} />

      {/* Grad-markering */}
      {showAxisLabels && [-30, -20, -10, 10, 20, 30].map(d => (
        <g key={d}>
          <line x1={toSvgX(d, g)} y1={g.centerY - 2} x2={toSvgX(d, g)} y2={g.centerY + 2}
            stroke="#aaa" strokeWidth={0.5} />
          <text x={toSvgX(d, g)} y={g.centerY + 12} textAnchor="middle" fontSize={7} fill="#aaa">{d}°</text>
        </g>
      ))}

      {/* Fiksationspunkt */}
      <circle cx={g.centerX} cy={g.centerY} r={2} fill="red" opacity={0.5} />
    </g>
  );
}
