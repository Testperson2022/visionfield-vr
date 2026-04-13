/**
 * ClusterOverlay — Markerer sammenhængende defekt-klynger
 *
 * Tegner en kontur/outline rundt om clusters.
 * Farve indikerer alvorlighed.
 */
import { GridConfig, toSvgX, toSvgY } from "./GridLayer";
import type { Cluster } from "../../screening/types";

interface Point {
  gridPointId: number;
  x: number;
  y: number;
}

interface Props {
  config: GridConfig;
  clusters: Cluster[];
  allPoints: Point[];
  visible?: boolean;
}

function clusterColor(cluster: Cluster): string {
  switch (cluster.worstProbability) {
    case "p05": return "#ef4444";
    case "p1": return "#f97316";
    case "p2": return "#eab308";
    default: return "#6b7280";
  }
}

export default function ClusterOverlay({ config: g, clusters, allPoints, visible = true }: Props) {
  if (!visible || clusters.length === 0) return null;

  const pointMap = new Map(allPoints.map(p => [p.gridPointId, p]));
  const r = g.scale * 3.5; // Padding rundt om punkter

  return (
    <g className="cluster-overlay">
      {clusters.map(cluster => {
        const color = clusterColor(cluster);
        const clusterPoints = cluster.pointIds
          .map(id => pointMap.get(id))
          .filter(Boolean) as Point[];

        if (clusterPoints.length === 0) return null;

        // Tegn en rounded outline rundt om cluster-punkter
        return (
          <g key={cluster.id}>
            {clusterPoints.map(pt => {
              const px = toSvgX(pt.x, g);
              const py = toSvgY(pt.y, g);
              return (
                <rect key={pt.gridPointId}
                  x={px - r} y={py - r} width={r * 2} height={r * 2}
                  fill="none" stroke={color} strokeWidth={1.5}
                  strokeDasharray="3,2" rx={3} opacity={0.7} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
