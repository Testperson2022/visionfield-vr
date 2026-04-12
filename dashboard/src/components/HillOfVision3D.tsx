/**
 * 3D Hill of Vision — Tredimensionel synsfelt-visualisering
 *
 * Viser tærskelværdier som "bjerge" i 3D perspektiv.
 * Højde = sensitivitet (dB), position = visuel vinkel.
 * Inspireret af OCULUS Easyfield 3D plot.
 *
 * Implementeret som isometrisk SVG (ingen WebGL-afhængighed).
 */

interface Props {
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
  }>;
  eye: "OD" | "OS";
}

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

export default function HillOfVision3D({ pointResults, eye }: Props) {
  const rMap = new Map(pointResults.map(p => [p.grid_point_id, p]));
  const W = 400, H = 300;
  const cx = W / 2, cy = H * 0.7;

  // Isometrisk projektion
  const isoX = (x: number, y: number) => cx + (x - y) * 4.5;
  const isoY = (x: number, y: number, z: number) => cy - (x + y) * 2.2 - z * 3;

  // Sortér punkter for korrekt z-order (back to front)
  const sorted = [...POINTS].sort((a, b) => (a.x + a.y) - (b.x + b.y));

  return (
    <div className="bg-white rounded-lg border p-4">
      <h4 className="text-sm font-bold text-gray-700 mb-2 text-center">
        3D Hill of Vision — {eye === "OD" ? "OD" : "OS"}
      </h4>
      <svg width={W} height={H} className="block mx-auto">
        {/* Basisplan */}
        <line x1={isoX(-30, 0)} y1={isoY(-30, 0, 0)} x2={isoX(30, 0)} y2={isoY(30, 0, 0)} stroke="#ddd" strokeWidth={0.5} />
        <line x1={isoX(0, -25)} y1={isoY(0, -25, 0)} x2={isoX(0, 25)} y2={isoY(0, 25, 0)} stroke="#ddd" strokeWidth={0.5} />

        {/* Søjler for hvert punkt */}
        {sorted.map(pt => {
          const r = rMap.get(pt.id);
          const db = r?.threshold_db ?? 0;
          const baseX = isoX(pt.x, pt.y);
          const baseY = isoY(pt.x, pt.y, 0);
          const topY = isoY(pt.x, pt.y, db);

          // Farve baseret på dB
          const g = Math.round(Math.max(0, Math.min(255, (db / 35) * 200 + 55)));
          const color = `rgb(${55}, ${g}, ${Math.round(g * 0.7)})`;

          return (
            <g key={pt.id}>
              <line x1={baseX} y1={baseY} x2={baseX} y2={topY} stroke={color} strokeWidth={3} />
              <circle cx={baseX} cy={topY} r={2.5} fill={color} />
            </g>
          );
        })}

        {/* Labels */}
        <text x={W - 10} y={H - 5} textAnchor="end" fontSize={8} fill="#999">dB</text>
      </svg>
    </div>
  );
}
