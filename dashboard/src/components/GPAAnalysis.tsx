/**
 * Glaucoma Progression Analysis (GPA) — Pointwise
 *
 * Sammenligner hvert testpunkt over tid med baseline.
 * Markerer punkter der viser signifikant forværring.
 *
 * Ref: Walsh 2010, p.114 — "Glaucoma Progression Analysis"
 * Ref: Humphrey STATPAC — point-by-point comparison
 *
 * Symbologi:
 *   ▲ = Signifikant forværring (>2 dB) ved 2+ konsekutive tests
 *   △ = Mulig forværring ved 1 test
 *   · = Ingen ændring
 */

const POINTS: Array<{ id: number; x: number; y: number }> = [
  {id:0,x:-27,y:3},{id:1,x:-21,y:3},{id:2,x:-15,y:3},{id:3,x:-9,y:3},{id:4,x:-3,y:3},
  {id:5,x:3,y:3},{id:6,x:9,y:3},{id:7,x:15,y:3},{id:8,x:21,y:3},{id:9,x:27,y:3},
  {id:10,x:-27,y:9},{id:11,x:-21,y:9},{id:12,x:-15,y:9},{id:13,x:-9,y:9},{id:14,x:-3,y:9},
  {id:15,x:3,y:9},{id:17,x:15,y:9},{id:18,x:21,y:9},{id:19,x:27,y:9},
  {id:20,x:-21,y:15},{id:21,x:-15,y:15},{id:22,x:-9,y:15},{id:23,x:-3,y:15},
  {id:24,x:3,y:15},{id:25,x:9,y:15},{id:26,x:15,y:15},{id:27,x:21,y:15},
  {id:28,x:-21,y:21},{id:29,x:-15,y:21},{id:30,x:-9,y:21},{id:31,x:-3,y:21},
  {id:32,x:3,y:-21},{id:33,x:9,y:-21},{id:34,x:15,y:-21},{id:35,x:21,y:-21},
  {id:36,x:-21,y:-15},{id:37,x:-15,y:-15},{id:38,x:-9,y:-15},{id:39,x:-3,y:-15},
  {id:40,x:3,y:-15},{id:41,x:9,y:-15},{id:42,x:15,y:-15},{id:43,x:21,y:-15},
  {id:44,x:-27,y:-9},{id:45,x:-21,y:-9},{id:46,x:-15,y:-9},{id:47,x:-9,y:-9},{id:48,x:-3,y:-9},
  {id:49,x:3,y:-9},{id:51,x:15,y:-9},{id:52,x:21,y:-9},{id:53,x:27,y:-9},
];

interface Session {
  results_json: any;
  started_at: string;
}

interface Props {
  sessions: Session[]; // Kronologisk rækkefølge (ældste først)
  eye: "OD" | "OS";
}

export default function GPAAnalysis({ sessions, eye }: Props) {
  const eyeSessions = sessions
    .filter((s: any) => s.eye === eye && s.results_json?.point_results)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (eyeSessions.length < 3) {
    return (
      <div className="bg-white rounded-lg border p-4 text-center text-gray-400 text-sm">
        Mindst 3 tests krævet for GPA ({eye})
      </div>
    );
  }

  // Baseline = gennemsnit af de første 2 tests
  const baseline1 = new Map<number, number>(eyeSessions[0].results_json.point_results.map((p: any) => [p.grid_point_id, p.total_deviation_db]));
  const baseline2 = new Map<number, number>(eyeSessions[1].results_json.point_results.map((p: any) => [p.grid_point_id, p.total_deviation_db]));

  const baselineTD = new Map<number, number>();
  POINTS.forEach(pt => {
    const v1 = baseline1.get(pt.id) ?? 0;
    const v2 = baseline2.get(pt.id) ?? 0;
    baselineTD.set(pt.id, (v1 + v2) / 2);
  });

  // Analysér seneste tests mod baseline
  const latestSession = eyeSessions[eyeSessions.length - 1];
  const prevSession = eyeSessions.length >= 3 ? eyeSessions[eyeSessions.length - 2] : null;

  const latestTD = new Map<number, number>(latestSession.results_json.point_results.map((p: any) => [p.grid_point_id, p.total_deviation_db]));
  const prevTD = prevSession ? new Map<number, number>(prevSession.results_json.point_results.map((p: any) => [p.grid_point_id, p.total_deviation_db])) : null;

  // Pointwise analyse
  type PointStatus = "stable" | "possible" | "likely" | "significant";
  const pointStatus = new Map<number, PointStatus>();
  let possibleCount = 0, likelyCount = 0;

  POINTS.forEach(pt => {
    const base = baselineTD.get(pt.id) ?? 0;
    const latest = latestTD.get(pt.id) ?? 0;
    const change = latest - base; // Negativ = forværring

    if (change < -3) {
      // Check om forrige test også viste forværring
      if (prevTD) {
        const prevChange = (prevTD.get(pt.id) ?? 0) - base;
        if (prevChange < -3) {
          pointStatus.set(pt.id, "likely");
          likelyCount++;
        } else {
          pointStatus.set(pt.id, "possible");
          possibleCount++;
        }
      } else {
        pointStatus.set(pt.id, "possible");
        possibleCount++;
      }
    } else {
      pointStatus.set(pt.id, "stable");
    }
  });

  // GPA conclusion
  let conclusion: string, conclusionColor: string;
  if (likelyCount >= 3) {
    conclusion = "Likely Progression";
    conclusionColor = "text-red-700 bg-red-50";
  } else if (possibleCount >= 3) {
    conclusion = "Possible Progression";
    conclusionColor = "text-yellow-700 bg-yellow-50";
  } else {
    conclusion = "No Progression";
    conclusionColor = "text-green-700 bg-green-50";
  }

  const S = 22, W = 420, H = 320;
  const cx = W / 2, cy = H / 2;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">GPA — {eye}</h4>
        <span className={`text-sm font-medium px-3 py-1 rounded ${conclusionColor}`}>
          {conclusion}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Baseline: {new Date(eyeSessions[0].started_at).toLocaleDateString("da-DK")} +{" "}
        {new Date(eyeSessions[1].started_at).toLocaleDateString("da-DK")} |{" "}
        Seneste: {new Date(latestSession.started_at).toLocaleDateString("da-DK")}
      </p>

      <svg width={W} height={H} style={{ display: "block", margin: "0 auto", fontFamily: "monospace" }}>
        <line x1={15} y1={cy} x2={W - 15} y2={cy} stroke="#ddd" strokeWidth={0.5} />
        <line x1={cx} y1={10} x2={cx} y2={H - 10} stroke="#ddd" strokeWidth={0.5} />

        {POINTS.map(pt => {
          const px = cx + (pt.x / 6) * S;
          const py = cy - (pt.y / 6) * S;
          const status = pointStatus.get(pt.id) ?? "stable";

          if (status === "likely") {
            return <text key={pt.id} x={px} y={py + 4} textAnchor="middle" fontSize={12} fill="#dc2626" fontWeight="bold">▲</text>;
          } else if (status === "possible") {
            return <text key={pt.id} x={px} y={py + 4} textAnchor="middle" fontSize={12} fill="#d97706">△</text>;
          } else {
            return <text key={pt.id} x={px} y={py + 4} textAnchor="middle" fontSize={8} fill="#ccc">·</text>;
          }
        })}
      </svg>

      <div className="flex gap-4 text-[9px] text-gray-500 justify-center mt-2">
        <span>▲ Likely ({likelyCount})</span>
        <span>△ Possible ({possibleCount})</span>
        <span>· Stable</span>
      </div>
    </div>
  );
}
