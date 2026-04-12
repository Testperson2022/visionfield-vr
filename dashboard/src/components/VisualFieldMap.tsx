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

/** SVG-baseret numerisk grid med akser og grad-markering */
function NumericPlot({ resultMap, field, title, showAxes }: {
  resultMap: Map<number, any>;
  field: "threshold_db" | "total_deviation_db" | "pattern_deviation_db";
  title: string;
  showAxes?: boolean;
}) {
  const w = 360, h = 340;
  const cx = w / 2, cy = h / 2;
  const s = 5.8; // pixels per grad

  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-2 text-center">{title}</div>
      <svg width={w} height={h} className="block mx-auto" style={{ fontFamily: "monospace" }}>
        {/* Akser */}
        <line x1={20} y1={cy} x2={w - 20} y2={cy} stroke="#bbb" strokeWidth={0.5} />
        <line x1={cx} y1={15} x2={cx} y2={h - 15} stroke="#bbb" strokeWidth={0.5} />

        {/* Grad-markering på akserne */}
        {showAxes && [-30, -20, -10, 0, 10, 20, 30].map(d => (
          <g key={`ax${d}`}>
            <line x1={cx + d * s} y1={cy - 3} x2={cx + d * s} y2={cy + 3} stroke="#999" strokeWidth={0.5} />
            <line x1={cx - 3} y1={cy - d * s} x2={cx + 3} y2={cy - d * s} stroke="#999" strokeWidth={0.5} />
            {d !== 0 && (
              <>
                <text x={cx + d * s} y={cy + 14} textAnchor="middle" fontSize={7} fill="#999">{d}</text>
                <text x={cx - 12} y={cy - d * s + 3} textAnchor="end" fontSize={7} fill="#999">{d}</text>
              </>
            )}
          </g>
        ))}

        {/* Datapunkter */}
        {POINTS.map(pt => {
          const r = resultMap.get(pt.id);
          const px = cx + pt.x * s;
          const py = cy - pt.y * s;

          if (pt.bs) {
            return <text key={pt.id} x={px} y={py + 3} textAnchor="middle" fontSize={8} fill="#999">·</text>;
          }

          let val: number;
          let displayText: string;
          let color = "#000";

          if (field === "threshold_db") {
            val = r ? r.threshold_db : 0;
            displayText = val < 0 ? "<0" : Math.round(val).toString();
          } else {
            val = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
            displayText = val >= 0 ? `+${Math.round(val)}` : Math.round(val).toString();
            if (val < -5) color = "#c00";
          }

          return (
            <text key={pt.id} x={px} y={py + 3} textAnchor="middle"
              fontSize={9} fill={color} fontWeight={val < -10 ? "bold" : "normal"}>
              {displayText}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

/** SVG probability symbol map */
function ProbabilityPlot({ resultMap, field, title }: {
  resultMap: Map<number, any>;
  field: "total_deviation_db" | "pattern_deviation_db";
  title: string;
}) {
  const w = 360, h = 300;
  const cx = w / 2, cy = h / 2;
  const s = 5.8;
  const cs = 14; // celle størrelse

  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-2 text-center">{title} — Probability</div>
      <svg width={w} height={h} className="block mx-auto">
        {/* Akser */}
        <line x1={20} y1={cy} x2={w - 20} y2={cy} stroke="#ddd" strokeWidth={0.5} />
        <line x1={cx} y1={15} x2={cx} y2={h - 15} stroke="#ddd" strokeWidth={0.5} />

        {POINTS.map(pt => {
          if (pt.bs) return null;
          const r = resultMap.get(pt.id);
          const dev = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
          const shade = devToShade(dev);
          const px = cx + pt.x * s;
          const py = cy - pt.y * s;

          if (shade === "transparent") return null;
          return (
            <rect key={pt.id}
              x={px - cs / 2} y={py - cs / 2}
              width={cs} height={cs}
              fill={shade} rx={1}
            />
          );
        })}
      </svg>
      <div className="flex gap-3 text-[9px] text-gray-500 justify-center mt-1">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block" style={{ background: "#ccc" }} /> &lt;5%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block" style={{ background: "#888" }} /> &lt;2%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block" style={{ background: "#444" }} /> &lt;1%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 inline-block" style={{ background: "#000" }} /> &lt;0.5%</span>
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
      <div className="flex justify-center gap-8 mb-8 flex-wrap">
        <NumericPlot resultMap={resultMap} field="threshold_db" title="Numeric Results (dB)" showAxes />
        <GrayscalePlot resultMap={resultMap} />
      </div>

      {/* Nederste række: Total Deviation + Pattern Deviation */}
      <div className="flex justify-center gap-8 flex-wrap">
        <div>
          <NumericPlot resultMap={resultMap} field="total_deviation_db" title="Total Deviation" />
          <ProbabilityPlot resultMap={resultMap} field="total_deviation_db" title="Total Deviation" />
        </div>
        <div>
          <NumericPlot resultMap={resultMap} field="pattern_deviation_db" title="Pattern Deviation" />
          <ProbabilityPlot resultMap={resultMap} field="pattern_deviation_db" title="Pattern Deviation" />
        </div>
      </div>
    </div>
  );
}
