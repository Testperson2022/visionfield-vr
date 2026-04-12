/**
 * VisionField VR — Humphrey-stil Single Field Printout
 *
 * 4 plots i klinisk format:
 * 1. Numerisk dB grid — tærskelværdier placeret på koordinatsystem
 * 2. Grayscale — interpoleret cirkulær heatmap
 * 3. Total Deviation — afvigelser + probability map
 * 4. Pattern Deviation — korrigerede afvigelser + probability map
 *
 * Ref: Walsh 2010, Fig 3-16; Humphrey VFA printout
 */

// Alle 54 testpunkter med koordinater
const POINTS: Array<{ id: number; x: number; y: number; bs?: boolean }> = [
  {id:0,x:-27,y:3},{id:1,x:-21,y:3},{id:2,x:-15,y:3},{id:3,x:-9,y:3},{id:4,x:-3,y:3},
  {id:5,x:3,y:3},{id:6,x:9,y:3},{id:7,x:15,y:3},{id:8,x:21,y:3},{id:9,x:27,y:3},
  {id:10,x:-27,y:9},{id:11,x:-21,y:9},{id:12,x:-15,y:9},{id:13,x:-9,y:9},{id:14,x:-3,y:9},
  {id:15,x:3,y:9},{id:16,x:9,y:9,bs:true},{id:17,x:15,y:9},{id:18,x:21,y:9},{id:19,x:27,y:9},
  {id:20,x:-21,y:15},{id:21,x:-15,y:15},{id:22,x:-9,y:15},{id:23,x:-3,y:15},
  {id:24,x:3,y:15},{id:25,x:9,y:15},{id:26,x:15,y:15},{id:27,x:21,y:15},
  {id:28,x:-21,y:21},{id:29,x:-15,y:21},{id:30,x:-9,y:21},{id:31,x:-3,y:21},
  {id:32,x:3,y:-21},{id:33,x:9,y:-21},{id:34,x:15,y:-21},{id:35,x:21,y:-21},
  {id:36,x:-21,y:-15},{id:37,x:-15,y:-15},{id:38,x:-9,y:-15},{id:39,x:-3,y:-15},
  {id:40,x:3,y:-15},{id:41,x:9,y:-15},{id:42,x:15,y:-15},{id:43,x:21,y:-15},
  {id:44,x:-27,y:-9},{id:45,x:-21,y:-9},{id:46,x:-15,y:-9},{id:47,x:-9,y:-9},{id:48,x:-3,y:-9},
  {id:49,x:3,y:-9},{id:50,x:9,y:-9,bs:true},{id:51,x:15,y:-9},{id:52,x:21,y:-9},{id:53,x:27,y:-9},
];

interface VisualFieldMapProps {
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
    pattern_deviation_db?: number;
  }>;
  eye: "OD" | "OS";
}

function dbToGray(db: number): number {
  return Math.round(Math.max(0, Math.min(255, (db / 35) * 255)));
}

// Probability symbol shading
function devToShade(dev: number): string {
  if (dev >= -2) return "transparent";
  if (dev >= -4) return "#ccc";
  if (dev >= -7) return "#888";
  if (dev >= -12) return "#444";
  return "#000";
}

/** SVG-baseret kompakt numerisk grid (Humphrey-stil) */
function NumericPlot({ resultMap, field, title }: {
  resultMap: Map<number, any>;
  field: "threshold_db" | "total_deviation_db" | "pattern_deviation_db";
  title: string;
}) {
  // Kompakt grid: 6° spacing = 22px per celle
  const cellW = 24;
  const cellH = 18;
  // Grid spænder x: -27 til 27 (10 kolonner), y: -21 til 21 (8 rækker)
  // Kolonne index: (x + 27) / 6 = 0..9
  // Række index: (21 - y) / 6 = 0..7 (men y=-3 og y=3 er tæt)
  const yValues = [21, 15, 9, 3, -3, -9, -15, -21]; // Bemærk: ingen y=-3 rækker i 24-2
  const gridW = 10 * cellW + 20;
  const gridH = 8 * cellH + 20;
  const ox = 10; // offset x
  const oy = 10; // offset y

  const colOf = (x: number) => ox + ((x + 27) / 6) * cellW + cellW / 2;
  const rowOf = (y: number) => {
    const idx = yValues.indexOf(y);
    if (idx === -1) return oy;
    return oy + idx * cellH + cellH / 2;
  };

  // Horisontal akse mellem y=3 og y=-3 (dvs. mellem idx 3 og 4)
  const axisY = oy + 3.5 * cellH + cellH / 2;
  // Vertikal akse mellem x=-3 og x=3 (dvs. kolonne 4.5)
  const axisX = ox + 4.5 * cellW + cellW / 2;

  return (
    <div>
      <div className="text-[10px] font-bold text-gray-700 mb-1 text-center">{title}</div>
      <svg width={gridW} height={gridH} className="block mx-auto" style={{ fontFamily: "ui-monospace, monospace" }}>
        {/* Tynd akse */}
        <line x1={0} y1={axisY} x2={gridW} y2={axisY} stroke="#ccc" strokeWidth={0.5} />
        <line x1={axisX} y1={0} x2={axisX} y2={gridH} stroke="#ccc" strokeWidth={0.5} />

        {POINTS.map(pt => {
          const px = colOf(pt.x);
          const py = rowOf(pt.y);
          const r = resultMap.get(pt.id);

          if (pt.bs) {
            return <text key={pt.id} x={px} y={py + 4} textAnchor="middle" fontSize={9} fill="#aaa">·</text>;
          }

          let val: number;
          let displayText: string;
          let color = "#222";

          if (field === "threshold_db") {
            val = r ? r.threshold_db : 0;
            displayText = val < 0 ? "<0" : Math.round(val).toString();
          } else {
            val = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
            displayText = val >= 0 ? Math.round(val).toString() : Math.round(val).toString();
            if (val < -5) color = "#b00";
            if (val >= 0) color = "#555";
          }

          return (
            <text key={pt.id} x={px} y={py + 4} textAnchor="middle"
              fontSize={9} fill={color}>
              {displayText}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** Kompakt probability symbol map */
function ProbabilityPlot({ resultMap, field }: {
  resultMap: Map<number, any>;
  field: "total_deviation_db" | "pattern_deviation_db";
}) {
  const cellW = 24;
  const cellH = 18;
  const cs = 14;
  const yValues = [21, 15, 9, 3, -3, -9, -15, -21];
  const gridW = 10 * cellW + 20;
  const gridH = 8 * cellH + 20;
  const ox = 10, oy = 10;

  const colOf = (x: number) => ox + ((x + 27) / 6) * cellW + cellW / 2;
  const rowOf = (y: number) => {
    const idx = yValues.indexOf(y);
    return oy + idx * cellH + cellH / 2;
  };

  return (
    <div>
      <svg width={gridW} height={gridH} className="block mx-auto">
        {POINTS.map(pt => {
          if (pt.bs) return null;
          const r = resultMap.get(pt.id);
          const dev = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
          const shade = devToShade(dev);
          if (shade === "transparent") return null;
          const px = colOf(pt.x);
          const py = rowOf(pt.y);
          return (
            <rect key={pt.id} x={px - cs / 2} y={py - cs / 2}
              width={cs} height={cs} fill={shade} />
          );
        })}
      </svg>
      <div className="flex gap-2 text-[8px] text-gray-500 justify-center">
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#ccc" }} /> &lt;5%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#888" }} /> &lt;2%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#444" }} /> &lt;1%</span>
        <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#000" }} /> &lt;0.5%</span>
      </div>
    </div>
  );
}

/** Interpoleret grayscale cirkel */
function GrayscalePlot({ resultMap }: { resultMap: Map<number, any> }) {
  const svgSize = 300;
  const center = svgSize / 2;
  const fieldRadius = center - 15;
  const scale = fieldRadius / 32;

  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-2 text-center">Grayscale</div>
      <svg width={svgSize} height={svgSize} className="block mx-auto">
        <defs>
          <clipPath id="gc">
            <circle cx={center} cy={center} r={fieldRadius} />
          </clipPath>
        </defs>
        <circle cx={center} cy={center} r={fieldRadius} fill="#000" />
        <g clipPath="url(#gc)">
          {POINTS.filter(p => !p.bs).map(pt => {
            const r = resultMap.get(pt.id);
            const db = r ? r.threshold_db : 0;
            const g = dbToGray(db);
            const px = center + pt.x * scale;
            const py = center - pt.y * scale;
            const gid = `g${pt.id}`;
            return (
              <g key={pt.id}>
                <defs>
                  <radialGradient id={gid}>
                    <stop offset="0%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="1" />
                    <stop offset="60%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="0.7" />
                    <stop offset="100%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx={px} cy={py} r={7.5 * scale} fill={`url(#${gid})`} />
              </g>
            );
          })}
        </g>
        <line x1={center - fieldRadius} y1={center} x2={center + fieldRadius} y2={center} stroke="#444" strokeWidth={0.5} />
        <line x1={center} y1={center - fieldRadius} x2={center} y2={center + fieldRadius} stroke="#444" strokeWidth={0.5} />
        <circle cx={center} cy={center} r={fieldRadius} fill="none" stroke="#555" strokeWidth={1} />
        <circle cx={center} cy={center} r={3} fill="red" />
        <text x={center} y={10} textAnchor="middle" fontSize={9} fill="#777">S</text>
        <text x={center} y={svgSize - 4} textAnchor="middle" fontSize={9} fill="#777">I</text>
        <text x={6} y={center + 3} fontSize={9} fill="#777">N</text>
        <text x={svgSize - 10} y={center + 3} fontSize={9} fill="#777">T</text>
      </svg>
    </div>
  );
}

export default function VisualFieldMap({ pointResults, eye }: VisualFieldMapProps) {
  const resultMap = new Map(pointResults.map(p => [p.grid_point_id, p]));

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">
        Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
      </h3>

      {/* Øverste række: Numerisk + Grayscale */}
      <div className="flex justify-center gap-6 mb-6 flex-wrap">
        <NumericPlot resultMap={resultMap} field="threshold_db" title="Numeric Results (dB)" />
        <GrayscalePlot resultMap={resultMap} />
      </div>

      {/* Nederste række: Total Deviation + Pattern Deviation */}
      <div className="flex justify-center gap-6 flex-wrap">
        <div>
          <NumericPlot resultMap={resultMap} field="total_deviation_db" title="Total Deviation" />
          <ProbabilityPlot resultMap={resultMap} field="total_deviation_db" />
        </div>
        <div>
          <NumericPlot resultMap={resultMap} field="pattern_deviation_db" title="Pattern Deviation" />
          <ProbabilityPlot resultMap={resultMap} field="pattern_deviation_db" />
        </div>
      </div>
    </div>
  );
}
