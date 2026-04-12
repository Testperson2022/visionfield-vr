/**
 * VisionField VR — 24-2 Synsfeltskort
 *
 * KERNEKOMPONENT: Recharts ScatterChart med 54 testpunkter.
 * Farvekodet efter tærskelværdi eller afvigelse fra normativ.
 *
 * Koordinater: x positiv = temporal, y positiv = superior.
 * Ref: shared/types/testGrid.ts — 24-2 Humphrey grid.
 */
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useState } from "react";
import { pointResultsToChartData, type VisualFieldPoint } from "../utils/chartHelpers";

// 24-2 grid koordinater (spejler shared/types/testGrid.ts)
const GRID_24_2 = [
  { id: 0, x_deg: -27, y_deg: 3, is_blind_spot: false }, { id: 1, x_deg: -21, y_deg: 3, is_blind_spot: false },
  { id: 2, x_deg: -15, y_deg: 3, is_blind_spot: false }, { id: 3, x_deg: -9, y_deg: 3, is_blind_spot: false },
  { id: 4, x_deg: -3, y_deg: 3, is_blind_spot: false }, { id: 5, x_deg: 3, y_deg: 3, is_blind_spot: false },
  { id: 6, x_deg: 9, y_deg: 3, is_blind_spot: false }, { id: 7, x_deg: 15, y_deg: 3, is_blind_spot: false },
  { id: 8, x_deg: 21, y_deg: 3, is_blind_spot: false }, { id: 9, x_deg: 27, y_deg: 3, is_blind_spot: false },
  { id: 10, x_deg: -27, y_deg: 9, is_blind_spot: false }, { id: 11, x_deg: -21, y_deg: 9, is_blind_spot: false },
  { id: 12, x_deg: -15, y_deg: 9, is_blind_spot: false }, { id: 13, x_deg: -9, y_deg: 9, is_blind_spot: false },
  { id: 14, x_deg: -3, y_deg: 9, is_blind_spot: false }, { id: 15, x_deg: 3, y_deg: 9, is_blind_spot: false },
  { id: 16, x_deg: 9, y_deg: 9, is_blind_spot: true }, { id: 17, x_deg: 15, y_deg: 9, is_blind_spot: false },
  { id: 18, x_deg: 21, y_deg: 9, is_blind_spot: false }, { id: 19, x_deg: 27, y_deg: 9, is_blind_spot: false },
  { id: 20, x_deg: -21, y_deg: 15, is_blind_spot: false }, { id: 21, x_deg: -15, y_deg: 15, is_blind_spot: false },
  { id: 22, x_deg: -9, y_deg: 15, is_blind_spot: false }, { id: 23, x_deg: -3, y_deg: 15, is_blind_spot: false },
  { id: 24, x_deg: 3, y_deg: 15, is_blind_spot: false }, { id: 25, x_deg: 9, y_deg: 15, is_blind_spot: false },
  { id: 26, x_deg: 15, y_deg: 15, is_blind_spot: false }, { id: 27, x_deg: 21, y_deg: 15, is_blind_spot: false },
  { id: 28, x_deg: -21, y_deg: 21, is_blind_spot: false }, { id: 29, x_deg: -15, y_deg: 21, is_blind_spot: false },
  { id: 30, x_deg: -9, y_deg: 21, is_blind_spot: false }, { id: 31, x_deg: -3, y_deg: 21, is_blind_spot: false },
  { id: 32, x_deg: 3, y_deg: -21, is_blind_spot: false }, { id: 33, x_deg: 9, y_deg: -21, is_blind_spot: false },
  { id: 34, x_deg: 15, y_deg: -21, is_blind_spot: false }, { id: 35, x_deg: 21, y_deg: -21, is_blind_spot: false },
  { id: 36, x_deg: -21, y_deg: -15, is_blind_spot: false }, { id: 37, x_deg: -15, y_deg: -15, is_blind_spot: false },
  { id: 38, x_deg: -9, y_deg: -15, is_blind_spot: false }, { id: 39, x_deg: -3, y_deg: -15, is_blind_spot: false },
  { id: 40, x_deg: 3, y_deg: -15, is_blind_spot: false }, { id: 41, x_deg: 9, y_deg: -15, is_blind_spot: false },
  { id: 42, x_deg: 15, y_deg: -15, is_blind_spot: false }, { id: 43, x_deg: 21, y_deg: -15, is_blind_spot: false },
  { id: 44, x_deg: -27, y_deg: -9, is_blind_spot: false }, { id: 45, x_deg: -21, y_deg: -9, is_blind_spot: false },
  { id: 46, x_deg: -15, y_deg: -9, is_blind_spot: false }, { id: 47, x_deg: -9, y_deg: -9, is_blind_spot: false },
  { id: 48, x_deg: -3, y_deg: -9, is_blind_spot: false }, { id: 49, x_deg: 3, y_deg: -9, is_blind_spot: false },
  { id: 50, x_deg: 9, y_deg: -9, is_blind_spot: true }, { id: 51, x_deg: 15, y_deg: -9, is_blind_spot: false },
  { id: 52, x_deg: 21, y_deg: -9, is_blind_spot: false }, { id: 53, x_deg: 27, y_deg: -9, is_blind_spot: false },
];

interface VisualFieldMapProps {
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
  }>;
  eye: "OD" | "OS";
}

export default function VisualFieldMap({ pointResults, eye }: VisualFieldMapProps) {
  const [mode, setMode] = useState<"threshold" | "deviation">("threshold");

  const chartData = pointResultsToChartData(pointResults, GRID_24_2, mode);

  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setMode("threshold")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "threshold" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Tærskel
          </button>
          <button
            onClick={() => setMode("deviation")}
            className={`px-3 py-1 rounded text-sm ${
              mode === "deviation" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
            }`}
          >
            Afvigelse
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[-33, 33]}
            label={{ value: "Grader (temporal +)", position: "bottom" }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[-27, 27]}
            label={{ value: "Grader (superior +)", angle: -90, position: "left" }}
          />
          <Tooltip
            content={({ payload }) => {
              if (!payload?.length) return null;
              const p = payload[0].payload as VisualFieldPoint;
              if (p.isBlindSpot) return <div className="bg-white p-2 border rounded shadow text-sm">Blind spot</div>;
              return (
                <div className="bg-white p-2 border rounded shadow text-sm">
                  <p>Punkt {p.id}</p>
                  <p>Tærskel: {p.thresholdDb.toFixed(1)} dB</p>
                  <p>Afvigelse: {p.deviationDb.toFixed(1)} dB</p>
                </div>
              );
            }}
          />
          <Scatter data={chartData} shape="circle">
            {chartData.map((point) => (
              <Cell
                key={point.id}
                fill={point.fill}
                r={point.isBlindSpot ? 4 : 8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Farvelegende */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 justify-center">
        {mode === "threshold" ? (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> &gt;28 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> 15-20 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> &lt;10 dB</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> &gt;-2 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-500" /> -2 til -5 dB</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> &lt;-10 dB</span>
          </>
        )}
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-400" /> Blind spot</span>
      </div>
    </div>
  );
}
