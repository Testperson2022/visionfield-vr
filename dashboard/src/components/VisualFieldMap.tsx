/**
 * VisionField VR — 24-2 Synsfeltskort (Humphrey-stil)
 *
 * Rendrer synsfelt som grayscale heatmap i klassisk Humphrey-format:
 * - Sort = blind (0 dB), Hvid = normal sensitivitet (>30 dB)
 * - Cirkulær visning med kryds-akser
 * - Numerisk overlay med dB-værdier
 *
 * Ref: Walsh 2010, Fig 3-16 — Humphrey single field printout
 */
import { useState } from "react";

const GRID_24_2 = [
  { id: 0, x: -27, y: 3, bs: false }, { id: 1, x: -21, y: 3, bs: false },
  { id: 2, x: -15, y: 3, bs: false }, { id: 3, x: -9, y: 3, bs: false },
  { id: 4, x: -3, y: 3, bs: false }, { id: 5, x: 3, y: 3, bs: false },
  { id: 6, x: 9, y: 3, bs: false }, { id: 7, x: 15, y: 3, bs: false },
  { id: 8, x: 21, y: 3, bs: false }, { id: 9, x: 27, y: 3, bs: false },
  { id: 10, x: -27, y: 9, bs: false }, { id: 11, x: -21, y: 9, bs: false },
  { id: 12, x: -15, y: 9, bs: false }, { id: 13, x: -9, y: 9, bs: false },
  { id: 14, x: -3, y: 9, bs: false }, { id: 15, x: 3, y: 9, bs: false },
  { id: 16, x: 9, y: 9, bs: true }, { id: 17, x: 15, y: 9, bs: false },
  { id: 18, x: 21, y: 9, bs: false }, { id: 19, x: 27, y: 9, bs: false },
  { id: 20, x: -21, y: 15, bs: false }, { id: 21, x: -15, y: 15, bs: false },
  { id: 22, x: -9, y: 15, bs: false }, { id: 23, x: -3, y: 15, bs: false },
  { id: 24, x: 3, y: 15, bs: false }, { id: 25, x: 9, y: 15, bs: false },
  { id: 26, x: 15, y: 15, bs: false }, { id: 27, x: 21, y: 15, bs: false },
  { id: 28, x: -21, y: 21, bs: false }, { id: 29, x: -15, y: 21, bs: false },
  { id: 30, x: -9, y: 21, bs: false }, { id: 31, x: -3, y: 21, bs: false },
  { id: 32, x: 3, y: -21, bs: false }, { id: 33, x: 9, y: -21, bs: false },
  { id: 34, x: 15, y: -21, bs: false }, { id: 35, x: 21, y: -21, bs: false },
  { id: 36, x: -21, y: -15, bs: false }, { id: 37, x: -15, y: -15, bs: false },
  { id: 38, x: -9, y: -15, bs: false }, { id: 39, x: -3, y: -15, bs: false },
  { id: 40, x: 3, y: -15, bs: false }, { id: 41, x: 9, y: -15, bs: false },
  { id: 42, x: 15, y: -15, bs: false }, { id: 43, x: 21, y: -15, bs: false },
  { id: 44, x: -27, y: -9, bs: false }, { id: 45, x: -21, y: -9, bs: false },
  { id: 46, x: -15, y: -9, bs: false }, { id: 47, x: -9, y: -9, bs: false },
  { id: 48, x: -3, y: -9, bs: false }, { id: 49, x: 3, y: -9, bs: false },
  { id: 50, x: 9, y: -9, bs: true }, { id: 51, x: 15, y: -9, bs: false },
  { id: 52, x: 21, y: -9, bs: false }, { id: 53, x: 27, y: -9, bs: false },
];

interface VisualFieldMapProps {
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
  }>;
  eye: "OD" | "OS";
}

/** Grayscale: 0 dB = sort, 35 dB = hvid (Humphrey-stil) */
function thresholdToGray(db: number): string {
  const clamped = Math.max(0, Math.min(35, db));
  const gray = Math.round((clamped / 35) * 255);
  return `rgb(${gray},${gray},${gray})`;
}

/** Afvigelse: rød for negativ, grøn for positiv/normal */
function deviationToColor(dev: number): string {
  if (dev >= -1) return "rgb(220,220,220)"; // Normal — lys grå
  if (dev >= -3) return "rgb(180,180,180)"; // Let nedsat
  if (dev >= -6) return "rgb(130,130,130)"; // Moderat
  if (dev >= -10) return "rgb(80,80,80)";   // Svært nedsat
  if (dev >= -20) return "rgb(40,40,40)";   // Meget svært
  return "rgb(0,0,0)";                       // Absolut skotom
}

export default function VisualFieldMap({ pointResults, eye }: VisualFieldMapProps) {
  const [mode, setMode] = useState<"grayscale" | "numeric" | "deviation">("grayscale");
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const resultMap = new Map(pointResults.map((p) => [p.grid_point_id, p]));

  // SVG dimensioner
  const size = 460;
  const center = size / 2;
  const scale = (size - 60) / 60; // 60° total range (-30 til +30)
  const cellSize = 5.5 * scale; // Hver celle er ~5.5° bred

  const toSvgX = (deg: number) => center + deg * scale;
  const toSvgY = (deg: number) => center - deg * scale; // Y inverteret

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
        </h3>
        <div className="flex gap-1">
          {(["grayscale", "numeric", "deviation"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded text-sm ${
                mode === m ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {m === "grayscale" ? "Grayscale" : m === "numeric" ? "Numerisk" : "Afvigelse"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Sort baggrund (cirkulær) */}
          <circle cx={center} cy={center} r={center - 10} fill="#1a1a1a" />

          {/* Akser */}
          <line x1={10} y1={center} x2={size - 10} y2={center} stroke="#444" strokeWidth={1} />
          <line x1={center} y1={10} x2={center} y2={size - 10} stroke="#444" strokeWidth={1} />

          {/* Grid-cirkler (10°, 20°, 30°) */}
          {[10, 20, 30].map((deg) => (
            <circle
              key={deg}
              cx={center} cy={center}
              r={deg * scale}
              fill="none" stroke="#333" strokeWidth={0.5}
              strokeDasharray="2,2"
            />
          ))}

          {/* Testpunkter */}
          {GRID_24_2.map((gp) => {
            const result = resultMap.get(gp.id);
            const threshold = result?.threshold_db ?? 0;
            const deviation = result?.total_deviation_db ?? 0;
            const isHovered = hoveredPoint === gp.id;

            let fill: string;
            if (gp.bs) {
              fill = "#333"; // Blind spot
            } else if (mode === "deviation") {
              fill = deviationToColor(deviation);
            } else {
              fill = thresholdToGray(threshold);
            }

            const cx = toSvgX(gp.x);
            const cy = toSvgY(gp.y);
            const half = cellSize / 2;

            return (
              <g key={gp.id}
                onMouseEnter={() => setHoveredPoint(gp.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Fyld-rektangel (Humphrey-stil blokke) */}
                <rect
                  x={cx - half} y={cy - half}
                  width={cellSize} height={cellSize}
                  fill={fill}
                  stroke={isHovered ? "#3b82f6" : "#222"}
                  strokeWidth={isHovered ? 2 : 0.5}
                  rx={1}
                />

                {/* Numerisk dB-værdi (i numeric mode) */}
                {mode === "numeric" && !gp.bs && (
                  <text
                    x={cx} y={cy + 4}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="monospace"
                    fill={threshold > 18 ? "#000" : "#fff"}
                  >
                    {Math.round(threshold)}
                  </text>
                )}

                {/* Afvigelse tekst */}
                {mode === "deviation" && !gp.bs && (
                  <text
                    x={cx} y={cy + 4}
                    textAnchor="middle"
                    fontSize={8}
                    fontFamily="monospace"
                    fill={deviation > -5 ? "#000" : "#fff"}
                  >
                    {deviation >= 0 ? `+${Math.round(deviation)}` : Math.round(deviation)}
                  </text>
                )}

                {/* Blind spot markering */}
                {gp.bs && (
                  <text x={cx} y={cy + 3} textAnchor="middle" fontSize={7} fill="#666">BS</text>
                )}
              </g>
            );
          })}

          {/* Fiksationspunkt (center) */}
          <circle cx={center} cy={center} r={3} fill="red" />

          {/* Labels */}
          <text x={center} y={15} textAnchor="middle" fontSize={10} fill="#888">S</text>
          <text x={center} y={size - 5} textAnchor="middle" fontSize={10} fill="#888">I</text>
          <text x={15} y={center + 4} textAnchor="middle" fontSize={10} fill="#888">N</text>
          <text x={size - 15} y={center + 4} textAnchor="middle" fontSize={10} fill="#888">T</text>
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredPoint !== null && (
        <div className="text-center text-sm text-gray-600 mt-2">
          {(() => {
            const gp = GRID_24_2.find((g) => g.id === hoveredPoint);
            if (!gp) return null;
            if (gp.bs) return "Blind spot";
            const r = resultMap.get(gp.id);
            if (!r) return `Punkt ${gp.id} — ingen data`;
            return `Punkt ${gp.id}: Tærskel ${r.threshold_db.toFixed(1)} dB | Afvigelse ${r.total_deviation_db.toFixed(1)} dB`;
          })()}
        </div>
      )}

      {/* Legende */}
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 justify-center">
        {mode === "deviation" ? (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"rgb(220,220,220)"}} /> Normal</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"rgb(130,130,130)"}} /> Moderat</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"rgb(40,40,40)"}} /> Svært nedsat</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"rgb(0,0,0)"}} /> Skotom</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"#fff"}} /> &gt;30 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"#aaa"}} /> ~20 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"#555"}} /> ~10 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 border" style={{background:"#000"}} /> 0 dB</span>
          </>
        )}
      </div>
    </div>
  );
}
