/**
 * VisionField VR — Humphrey VFA Single Field Printout
 *
 * Klinisk korrekt gengivelse baseret på:
 * - Walsh 2010, Fig 3-16 (p.100) og Fig 3-20 (p.106)
 * - Humphrey Visual Field Analyzer printout standard
 *
 * Grayscale: dot-density plot (tætte prikker = lav sensitivitet)
 * Numerisk: centreret grid med akser og grad-labels
 * Deviation: numerisk + probability symbol blocks
 */

// Punkt-definitioner med koordinater
const PTS: Array<{ id: number; x: number; y: number; bs?: boolean }> = [
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

interface Props {
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
    pattern_deviation_db?: number;
  }>;
  eye: "OD" | "OS";
}

// ─── Numerisk Grid ─────────────────────────────────────────────
// Placerer tal på koordinat-akser ligesom det andet billede du viste
function NumericGrid({ rMap, field, title }: {
  rMap: Map<number, any>; field: string; title: string;
}) {
  const S = 22; // pixels per 6°
  const W = 420, H = 340;
  const cx = W / 2, cy = H / 2;

  return (
    <div>
      <div className="text-[10px] font-bold text-gray-600 mb-1 text-center">{title}</div>
      <svg width={W} height={H} style={{ fontFamily: "ui-monospace,monospace", display: "block", margin: "0 auto" }}>
        {/* Akser */}
        <line x1={15} y1={cy} x2={W - 15} y2={cy} stroke="#999" strokeWidth={0.7} />
        <line x1={cx} y1={10} x2={cx} y2={H - 10} stroke="#999" strokeWidth={0.7} />

        {/* Grad-labels på akserne */}
        {[-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30].map(d => {
          const px = cx + (d / 6) * S;
          const py = cy - (d / 6) * S;
          return (
            <g key={`t${d}`}>
              {Math.abs(d) % 10 === 0 && (
                <>
                  <line x1={px} y1={cy - 2} x2={px} y2={cy + 2} stroke="#999" strokeWidth={0.5} />
                  <text x={px} y={cy + 12} textAnchor="middle" fontSize={7} fill="#999">{d}</text>
                  <line x1={cx - 2} y1={py} x2={cx + 2} y2={py} stroke="#999" strokeWidth={0.5} />
                  <text x={cx - 8} y={py + 3} textAnchor="end" fontSize={7} fill="#999">{d}</text>
                </>
              )}
            </g>
          );
        })}

        {/* Datapunkter */}
        {PTS.map(pt => {
          const px = cx + (pt.x / 6) * S;
          const py = cy - (pt.y / 6) * S;
          const r = rMap.get(pt.id);

          if (pt.bs) return (
            <text key={pt.id} x={px} y={py + 3} textAnchor="middle" fontSize={7} fill="#bbb">·</text>
          );

          let val: number, txt: string, col = "#111";
          if (field === "t") {
            val = r?.threshold_db ?? 0;
            txt = val < 0 ? "<0" : Math.round(val).toString();
          } else {
            val = field === "pd" ? (r?.pattern_deviation_db ?? r?.total_deviation_db ?? 0) : (r?.total_deviation_db ?? 0);
            txt = Math.round(val).toString();
            if (val < -5) col = "#b00";
            if (val >= 0) col = "#666";
          }

          return (
            <text key={pt.id} x={px} y={py + 4} textAnchor="middle" fontSize={10} fill={col}>{txt}</text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Dot-Density Grayscale ─────────────────────────────────────
// Humphrey-stil: tætte prikker = mørk (lav dB), spredte = lys (høj dB)
function DotGrayscale({ rMap }: { rMap: Map<number, any> }) {
  const S = 14; // pixels per 6° (mindre end numerisk)
  const W = 280, H = 260;
  const cx = W / 2, cy = H / 2;
  const R = 115; // felt-radius

  // Generér dots: hvert punkt har en "zone" med prikker
  // Lav dB = mange prikker (tæt), Høj dB = få prikker (spredt)
  const dots: Array<{ x: number; y: number }> = [];
  const rng = (seed: number) => {
    let s = seed;
    return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
  };

  PTS.forEach(pt => {
    if (pt.bs) return;
    const r = rMap.get(pt.id);
    const db = r?.threshold_db ?? 0;
    // Antal prikker: 0 dB = 40 prikker (mørkt), 35 dB = 0 prikker (lyst)
    const numDots = Math.max(0, Math.round((1 - db / 35) * 35));
    const pcx = cx + (pt.x / 6) * S;
    const pcy = cy - (pt.y / 6) * S;
    const rand = rng(pt.id * 1000 + 42);

    for (let i = 0; i < numDots; i++) {
      const dx = (rand() - 0.5) * S * 1.4;
      const dy = (rand() - 0.5) * S * 1.4;
      const x = pcx + dx;
      const y = pcy + dy;
      // Kun inden for felt-radius
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist < R) dots.push({ x, y });
    }
  });

  return (
    <div>
      <div className="text-[10px] font-bold text-gray-600 mb-1 text-center">Grayscale</div>
      <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
        <defs>
          <clipPath id="fclip"><circle cx={cx} cy={cy} r={R} /></clipPath>
        </defs>
        {/* Hvid baggrund (= normalt syn) */}
        <circle cx={cx} cy={cy} r={R} fill="#fff" stroke="#333" strokeWidth={1} />
        {/* Dots */}
        <g clipPath="url(#fclip)">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={0.8} fill="#000" />
          ))}
        </g>
        {/* Akser */}
        <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#333" strokeWidth={0.5} />
        <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#333" strokeWidth={0.5} />
        {/* Blind spot */}
        {PTS.filter(p => p.bs).map(pt => (
          <circle key={pt.id} cx={cx + (pt.x / 6) * S} cy={cy - (pt.y / 6) * S}
            r={5} fill="#000" stroke="#333" strokeWidth={0.5} />
        ))}
        {/* 30° label */}
        <text x={cx + R - 2} y={cy + 11} textAnchor="end" fontSize={7} fill="#666">30</text>
      </svg>
    </div>
  );
}

// ─── Probability Blocks ────────────────────────────────────────
function ProbBlocks({ rMap, field }: { rMap: Map<number, any>; field: string }) {
  const S = 14;
  const W = 280, H = 260;
  const cx = W / 2, cy = H / 2;
  const bs = 11; // block size

  return (
    <svg width={W} height={H} style={{ display: "block", margin: "0 auto" }}>
      <line x1={cx - 120} y1={cy} x2={cx + 120} y2={cy} stroke="#ddd" strokeWidth={0.3} />
      <line x1={cx} y1={cy - 100} x2={cx} y2={cy + 100} stroke="#ddd" strokeWidth={0.3} />
      {PTS.map(pt => {
        if (pt.bs) return null;
        const r = rMap.get(pt.id);
        const dev = field === "pd" ? (r?.pattern_deviation_db ?? r?.total_deviation_db ?? 0) : (r?.total_deviation_db ?? 0);

        let shade: string | null = null;
        if (dev < -12) shade = "#111";
        else if (dev < -7) shade = "#555";
        else if (dev < -4) shade = "#999";
        else if (dev < -2) shade = "#ccc";

        if (!shade) return null;
        const px = cx + (pt.x / 6) * S;
        const py = cy - (pt.y / 6) * S;
        return <rect key={pt.id} x={px - bs / 2} y={py - bs / 2} width={bs} height={bs} fill={shade} />;
      })}
    </svg>
  );
}

function Legend() {
  return (
    <div className="flex gap-2 text-[8px] text-gray-500 justify-center mt-1">
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block border" style={{ background: "#ccc" }} /> &lt;5%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#999" }} /> &lt;2%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#555" }} /> &lt;1%</span>
      <span className="flex items-center gap-0.5"><span className="w-2 h-2 inline-block" style={{ background: "#111" }} /> &lt;0.5%</span>
    </div>
  );
}

// ─── Hovedkomponent ────────────────────────────────────────────
export default function VisualFieldMap({ pointResults, eye }: Props) {
  const rMap = new Map(pointResults.map(p => [p.grid_point_id, p]));

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="font-semibold text-gray-900 mb-6">
        Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
      </h3>

      {/* Øverst: Numerisk dB + Dot-density grayscale */}
      <div className="flex justify-center gap-6 mb-8 flex-wrap items-start">
        <NumericGrid rMap={rMap} field="t" title="Numeric Results (dB)" />
        <DotGrayscale rMap={rMap} />
      </div>

      {/* Nederst: Total Deviation + Pattern Deviation */}
      <div className="flex justify-center gap-6 flex-wrap items-start">
        <div>
          <NumericGrid rMap={rMap} field="td" title="Total Deviation" />
          <ProbBlocks rMap={rMap} field="td" />
          <Legend />
        </div>
        <div>
          <NumericGrid rMap={rMap} field="pd" title="Pattern Deviation" />
          <ProbBlocks rMap={rMap} field="pd" />
          <Legend />
        </div>
      </div>
    </div>
  );
}
