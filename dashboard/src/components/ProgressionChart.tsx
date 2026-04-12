/**
 * Progression Analysis — MD Trend over tid
 *
 * Viser Mean Deviation (dB) over tid for et øje.
 * Lineær regression beregner MD slope (dB/år).
 * Ref: OPI visualFields — progression analysis, MD slope
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface Session {
  id: string;
  started_at: string;
  eye: string;
  results_json: any;
  is_reliable: boolean;
}

interface Props {
  sessions: Session[];
  eye: "OD" | "OS";
}

function linearRegression(points: Array<{ x: number; y: number }>) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export default function ProgressionChart({ sessions, eye }: Props) {
  const eyeSessions = sessions
    .filter(s => s.eye === eye && s.results_json?.mean_deviation_db != null)
    .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());

  if (eyeSessions.length < 2) {
    return (
      <div className="bg-white rounded-lg border p-4 text-center text-gray-400 text-sm">
        Mindst 2 tests krævet for progression ({eye})
      </div>
    );
  }

  const firstDate = new Date(eyeSessions[0].started_at).getTime();
  const data = eyeSessions.map(s => ({
    date: new Date(s.started_at).toLocaleDateString("da-DK"),
    md: s.results_json.mean_deviation_db,
    daysSinceFirst: (new Date(s.started_at).getTime() - firstDate) / (1000 * 60 * 60 * 24),
  }));

  // MD slope (dB/år)
  const regPoints = data.map(d => ({ x: d.daysSinceFirst / 365, y: d.md }));
  const { slope } = linearRegression(regPoints);
  const slopeSignificant = Math.abs(slope) > 0.5;

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">
          MD Trend — {eye === "OD" ? "Højre (OD)" : "Venstre (OS)"}
        </h4>
        <span className={`text-sm font-mono px-2 py-0.5 rounded ${
          slopeSignificant ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
        }`}>
          Slope: {slope.toFixed(2)} dB/år
          {slopeSignificant ? " ⚠" : " ✓"}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={10} />
          <YAxis domain={["auto", "auto"]} fontSize={10} label={{ value: "MD (dB)", angle: -90, position: "left", fontSize: 10 }} />
          <Tooltip />
          <ReferenceLine y={-2} stroke="#eab308" strokeDasharray="3 3" label={{ value: "Borderline", fontSize: 9 }} />
          <ReferenceLine y={-6} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Abnormal", fontSize: 9 }} />
          <Line type="monotone" dataKey="md" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
