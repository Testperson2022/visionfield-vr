/**
 * VisionField VR — Humphrey VFA Single Field Printout
 *
 * Pixel-perfekt gengivelse af Humphrey 24-2 printout.
 * Ref: Walsh 2010, Fig 3-16 (p.100) og Fig 3-20 (p.106)
 *
 * Layout: 10 kolonner × 9 rækker (med gaps for 24-2 diamant-form)
 * Rækkerne (top→bund): y = 27, 21, 15, 9, 3, -3, -9, -15, -21, -27
 * Men 24-2 bruger: 21, 15, 9, 3, -9, -15, -21 (ingen y=±27, ingen y=-3/+3 gap)
 *
 * Korrekt 24-2 punkt-layout (● = testpunkt, · = tomt):
 *   Row y=21:  · · · ● ● ● ● · · ·    (4 punkter: x=-9,-3,+3,+9... nej)
 *
 * FAKTISK layout fra Humphrey (talt fra bogen):
 *   y=21:           ○ ○ ○ ○                       4 punkter  (x=-21,-15,-9,-3)
 *   y=15:        ○ ○ ○ ○ ○ ○ ○ ○                  8 punkter
 *   y=9:      ○ ○ ○ ○ ○ ○ BS ○ ○ ○               10 punkter
 *   y=3:      ○ ○ ○ ○ ○ ○ ○ ○ ○ ○                10 punkter
 *   ─────────────────────────────── horisontal akse
 *   y=-9:     ○ ○ ○ ○ ○ ○ BS ○ ○ ○               10 punkter
 *   y=-15:       ○ ○ ○ ○ ○ ○ ○ ○                  8 punkter
 *   y=-21:                ○ ○ ○ ○                  4 punkter  (x=3,9,15,21)
 */

// Grid-definition: hvilke x-positioner eksisterer per y-række
const ROWS: Array<{ y: number; cols: Array<{ id: number; x: number; bs?: boolean } | null> }> = [
  { y: 21, cols: [
    null, null, null,
    { id: 28, x: -9 }, { id: 29, x: -3 },  // Venstre side af akse
    null, null,  // akse-gap
    null, null, null
  ]},
  // Lad mig definere det korrekt med den fulde x-range -27 til 27
];

// Bedre tilgang: definer punkter per række med præcise x-positioner
// x-kolonner: -27, -21, -15, -9, -3, 3, 9, 15, 21, 27 (10 kolonner)
const X_COLS = [-27, -21, -15, -9, -3, 3, 9, 15, 21, 27];

// Punkt-ID lookup: key = "x,y" → id
const POINT_MAP: Record<string, { id: number; bs?: boolean }> = {};
[
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
].forEach(p => { POINT_MAP[`${p.x},${p.y}`] = { id: p.id, bs: p.bs }; });

// Y-rækker fra top til bund (med akse mellem y=3 og y=-9)
const Y_ROWS = [21, 15, 9, 3, -9, -15, -21];

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

function devToShade(dev: number): string | null {
  if (dev >= -2) return null;
  if (dev >= -4) return "#ccc";
  if (dev >= -7) return "#999";
  if (dev >= -12) return "#555";
  return "#111";
}

/** En enkelt grid-visning — bruges til alle 4 plots */
function FieldGrid({ resultMap, mode }: {
  resultMap: Map<number, any>;
  mode: "numeric" | "grayscale" | "td_numeric" | "td_prob" | "pd_numeric" | "pd_prob";
}) {
  const cell = mode === "grayscale" || mode === "td_prob" || mode === "pd_prob" ? 20 : 26;
  const gap = mode === "grayscale" || mode === "td_prob" || mode === "pd_prob" ? 1 : 2;
  const axisGap = mode === "grayscale" || mode === "td_prob" || mode === "pd_prob" ? 4 : 6;
  const totalW = X_COLS.length * (cell + gap);
  const axisRowIdx = 4; // Akse mellem y=3 (idx 3) og y=-9 (idx 4)
  const totalH = Y_ROWS.length * (cell + gap) + axisGap;

  return (
    <svg width={totalW} height={totalH} style={{ display: "block", margin: "0 auto", fontFamily: "ui-monospace, monospace" }}>
      {Y_ROWS.map((y, ri) => {
        const rowY = ri * (cell + gap) + (ri >= axisRowIdx ? axisGap : 0);

        return X_COLS.map((x, ci) => {
          const key = `${x},${y}`;
          const pt = POINT_MAP[key];
          if (!pt) return null;

          const cellX = ci * (cell + gap);
          const r = resultMap.get(pt.id);
          const threshold = r?.threshold_db ?? 0;
          const td = r?.total_deviation_db ?? 0;
          const pd = r?.pattern_deviation_db ?? td;

          if (mode === "grayscale") {
            const g = pt.bs ? 40 : dbToGray(threshold);
            return (
              <rect key={key} x={cellX} y={rowY} width={cell} height={cell}
                fill={`rgb(${g},${g},${g})`} />
            );
          }

          if (mode === "td_prob" || mode === "pd_prob") {
            const dev = mode === "td_prob" ? td : pd;
            const shade = devToShade(dev);
            if (pt.bs) return null;
            return (
              <rect key={key} x={cellX} y={rowY} width={cell} height={cell}
                fill={shade ?? "#f0f0f0"} stroke={shade ? "none" : "#e0e0e0"} strokeWidth={0.5} />
            );
          }

          // Numerisk modes
          if (pt.bs) {
            return (
              <text key={key} x={cellX + cell / 2} y={rowY + cell / 2 + 4}
                textAnchor="middle" fontSize={8} fill="#999">·</text>
            );
          }

          let val: number, color = "#222";
          if (mode === "numeric") {
            val = threshold;
          } else if (mode === "td_numeric") {
            val = td;
            if (val < -5) color = "#b00";
            if (val >= 0) color = "#666";
          } else {
            val = pd;
            if (val < -5) color = "#b00";
            if (val >= 0) color = "#666";
          }

          const text = mode === "numeric"
            ? (val < 0 ? "<0" : Math.round(val).toString())
            : Math.round(val).toString();

          return (
            <text key={key} x={cellX + cell / 2} y={rowY + cell / 2 + 4}
              textAnchor="middle" fontSize={9} fill={color}>
              {text}
            </text>
          );
        });
      })}

      {/* Horisontal akse */}
      <line x1={0} y1={axisRowIdx * (cell + gap) + axisGap / 2}
        x2={totalW} y2={axisRowIdx * (cell + gap) + axisGap / 2}
        stroke="#aaa" strokeWidth={0.5} />
    </svg>
  );
}

export default function VisualFieldMap({ pointResults, eye }: VisualFieldMapProps) {
  const resultMap = new Map(pointResults.map(p => [p.grid_point_id, p]));

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">
        Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
      </h3>

      {/* Øverste: Numerisk + Grayscale side om side */}
      <div className="flex justify-center gap-10 mb-8 flex-wrap items-start">
        <div>
          <div className="text-[10px] font-bold text-gray-600 mb-2 text-center">Numeric Results (dB)</div>
          <FieldGrid resultMap={resultMap} mode="numeric" />
        </div>
        <div>
          <div className="text-[10px] font-bold text-gray-600 mb-2 text-center">Grayscale</div>
          <div className="bg-black p-1 inline-block">
            <FieldGrid resultMap={resultMap} mode="grayscale" />
          </div>
        </div>
      </div>

      {/* Nederste: TD + PD — hvert med numerisk over probability */}
      <div className="flex justify-center gap-10 flex-wrap items-start">
        <div>
          <div className="text-[10px] font-bold text-gray-600 mb-2 text-center">Total Deviation</div>
          <FieldGrid resultMap={resultMap} mode="td_numeric" />
          <div className="mt-2">
            <FieldGrid resultMap={resultMap} mode="td_prob" />
          </div>
          <Legend />
        </div>
        <div>
          <div className="text-[10px] font-bold text-gray-600 mb-2 text-center">Pattern Deviation</div>
          <FieldGrid resultMap={resultMap} mode="pd_numeric" />
          <div className="mt-2">
            <FieldGrid resultMap={resultMap} mode="pd_prob" />
          </div>
          <Legend />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex gap-2 text-[8px] text-gray-500 justify-center mt-2">
      <span className="flex items-center gap-0.5">◻ &lt;5%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#999" }} /> &lt;2%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#555" }} /> &lt;1%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#111" }} /> &lt;0.5%</span>
    </div>
  );
}
