/**
 * VisionField VR — Humphrey-stil Single Field Printout
 *
 * Rendrer testresultater i klassisk Humphrey VFA-format med 4 plots:
 * 1. Numerisk dB grid (øverst venstre)
 * 2. Grayscale heatmap (øverst højre) — interpoleret med næseform
 * 3. Total Deviation med probability symbols (nederst venstre)
 * 4. Pattern Deviation med probability symbols (nederst højre)
 *
 * Ref: Walsh 2010, Fig 3-16 — Sample single field printout
 */
import { useState } from "react";

// 24-2 grid: rækker fra top (y=21) til bund (y=-21)
// Hver række har variabel antal punkter (næseformet)
const GRID_ROWS: Array<{ y: number; points: Array<{ id: number; x: number; bs?: boolean }> }> = [
  { y: 21, points: [{ id: 28, x: -21 }, { id: 29, x: -15 }, { id: 30, x: -9 }, { id: 31, x: -3 }] },
  { y: 15, points: [{ id: 20, x: -21 }, { id: 21, x: -15 }, { id: 22, x: -9 }, { id: 23, x: -3 }, { id: 24, x: 3 }, { id: 25, x: 9 }, { id: 26, x: 15 }, { id: 27, x: 21 }] },
  { y: 9, points: [{ id: 10, x: -27 }, { id: 11, x: -21 }, { id: 12, x: -15 }, { id: 13, x: -9 }, { id: 14, x: -3 }, { id: 15, x: 3 }, { id: 16, x: 9, bs: true }, { id: 17, x: 15 }, { id: 18, x: 21 }, { id: 19, x: 27 }] },
  { y: 3, points: [{ id: 0, x: -27 }, { id: 1, x: -21 }, { id: 2, x: -15 }, { id: 3, x: -9 }, { id: 4, x: -3 }, { id: 5, x: 3 }, { id: 6, x: 9 }, { id: 7, x: 15 }, { id: 8, x: 21 }, { id: 9, x: 27 }] },
  { y: -3, points: [] }, // Meridian gap
  { y: -9, points: [{ id: 44, x: -27 }, { id: 45, x: -21 }, { id: 46, x: -15 }, { id: 47, x: -9 }, { id: 48, x: -3 }, { id: 49, x: 3 }, { id: 50, x: 9, bs: true }, { id: 51, x: 15 }, { id: 52, x: 21 }, { id: 53, x: 27 }] },
  { y: -15, points: [{ id: 36, x: -21 }, { id: 37, x: -15 }, { id: 38, x: -9 }, { id: 39, x: -3 }, { id: 40, x: 3 }, { id: 41, x: 9 }, { id: 42, x: 15 }, { id: 43, x: 21 }] },
  { y: -21, points: [{ id: 32, x: 3 }, { id: 33, x: 9 }, { id: 34, x: 15 }, { id: 35, x: 21 }] },
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

// Grayscale: 0 dB = sort, ≥35 dB = hvid
function dbToGray(db: number): number {
  return Math.round(Math.max(0, Math.min(255, (db / 35) * 255)));
}

// Probability symbol baseret på deviation (simuleret p-value)
// ■ = p<0.5%, ▪ = p<1%, ▫ = p<2%, ░ = p<5%
function deviationToSymbol(dev: number): { symbol: string; shade: string } {
  if (dev >= -2) return { symbol: "", shade: "transparent" };
  if (dev >= -4) return { symbol: "░", shade: "#ccc" };       // p < 5%
  if (dev >= -7) return { symbol: "▪", shade: "#888" };       // p < 2%
  if (dev >= -12) return { symbol: "■", shade: "#444" };      // p < 1%
  return { symbol: "█", shade: "#000" };                       // p < 0.5%
}

function NumericGrid({ resultMap, title }: {
  resultMap: Map<number, { threshold_db: number; total_deviation_db: number; pattern_deviation_db?: number }>;
  title: string;
}) {
  const cellSize = 28;
  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-1 text-center">{title}</div>
      <div className="flex flex-col items-center gap-0">
        {GRID_ROWS.map((row, ri) => {
          if (row.points.length === 0) return <div key={ri} className="h-1" />;
          const maxCols = 10;
          // Centrér rækken baseret på x-koordinater
          const minX = Math.min(...row.points.map(p => p.x));
          const offsetCols = Math.round((minX + 27) / 6);
          return (
            <div key={ri} className="flex" style={{ marginLeft: offsetCols * cellSize }}>
              {row.points.map((pt) => {
                const r = resultMap.get(pt.id);
                const val = r ? Math.round(r.threshold_db) : 0;
                return (
                  <div key={pt.id} className="text-center font-mono leading-none"
                    style={{ width: cellSize, height: 20, fontSize: 10, color: pt.bs ? "#999" : "#000" }}>
                    {pt.bs ? "·" : val}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Alle 54 punkters koordinater til SVG grayscale
const ALL_POINTS = [
  {id:0,x:-27,y:3},{id:1,x:-21,y:3},{id:2,x:-15,y:3},{id:3,x:-9,y:3},{id:4,x:-3,y:3},{id:5,x:3,y:3},{id:6,x:9,y:3},{id:7,x:15,y:3},{id:8,x:21,y:3},{id:9,x:27,y:3},
  {id:10,x:-27,y:9},{id:11,x:-21,y:9},{id:12,x:-15,y:9},{id:13,x:-9,y:9},{id:14,x:-3,y:9},{id:15,x:3,y:9},{id:16,x:9,y:9,bs:true},{id:17,x:15,y:9},{id:18,x:21,y:9},{id:19,x:27,y:9},
  {id:20,x:-21,y:15},{id:21,x:-15,y:15},{id:22,x:-9,y:15},{id:23,x:-3,y:15},{id:24,x:3,y:15},{id:25,x:9,y:15},{id:26,x:15,y:15},{id:27,x:21,y:15},
  {id:28,x:-21,y:21},{id:29,x:-15,y:21},{id:30,x:-9,y:21},{id:31,x:-3,y:21},
  {id:32,x:3,y:-21},{id:33,x:9,y:-21},{id:34,x:15,y:-21},{id:35,x:21,y:-21},
  {id:36,x:-21,y:-15},{id:37,x:-15,y:-15},{id:38,x:-9,y:-15},{id:39,x:-3,y:-15},{id:40,x:3,y:-15},{id:41,x:9,y:-15},{id:42,x:15,y:-15},{id:43,x:21,y:-15},
  {id:44,x:-27,y:-9},{id:45,x:-21,y:-9},{id:46,x:-15,y:-9},{id:47,x:-9,y:-9},{id:48,x:-3,y:-9},{id:49,x:3,y:-9},{id:50,x:9,y:-9,bs:true},{id:51,x:15,y:-9},{id:52,x:21,y:-9},{id:53,x:27,y:-9},
];

function GrayscaleGrid({ resultMap }: {
  resultMap: Map<number, { threshold_db: number }>;
}) {
  // SVG-baseret interpoleret grayscale (Humphrey-stil)
  const svgSize = 240;
  const center = svgSize / 2;
  const fieldRadius = center - 10;
  const scale = fieldRadius / 32; // 32° max radius

  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-1 text-center">Grayscale</div>
      <svg width={svgSize} height={svgSize} className="block mx-auto">
        <defs>
          <clipPath id="fieldClip">
            <circle cx={center} cy={center} r={fieldRadius} />
          </clipPath>
        </defs>

        {/* Sort baggrund med cirkulær clip */}
        <circle cx={center} cy={center} r={fieldRadius} fill="#000" />

        {/* Interpolerede cirkler per testpunkt — store bløde spots */}
        <g clipPath="url(#fieldClip)">
          {ALL_POINTS.map((pt) => {
            if (pt.bs) return null;
            const r = resultMap.get(pt.id);
            const db = r ? r.threshold_db : 0;
            const g = dbToGray(db);
            const cx = center + pt.x * scale;
            const cy = center - pt.y * scale;
            // Brug store, overlappende radial gradients for glat interpolation
            const gradId = `grad_${pt.id}`;
            return (
              <g key={pt.id}>
                <defs>
                  <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="1" />
                    <stop offset="70%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={`rgb(${g},${g},${g})`} stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx={cx} cy={cy} r={7 * scale} fill={`url(#${gradId})`} />
              </g>
            );
          })}
        </g>

        {/* Kryds-akser */}
        <line x1={center - fieldRadius} y1={center} x2={center + fieldRadius} y2={center} stroke="#555" strokeWidth={0.5} />
        <line x1={center} y1={center - fieldRadius} x2={center} y2={center + fieldRadius} stroke="#555" strokeWidth={0.5} />

        {/* Cirkel-border */}
        <circle cx={center} cy={center} r={fieldRadius} fill="none" stroke="#666" strokeWidth={1} />

        {/* Blind spot indikator */}
        {ALL_POINTS.filter(p => p.bs).map(pt => (
          <circle key={pt.id}
            cx={center + pt.x * scale} cy={center - pt.y * scale}
            r={3} fill="none" stroke="#555" strokeWidth={0.5} />
        ))}

        {/* S/I/N/T labels */}
        <text x={center} y={8} textAnchor="middle" fontSize={8} fill="#888">S</text>
        <text x={center} y={svgSize - 3} textAnchor="middle" fontSize={8} fill="#888">I</text>
        <text x={5} y={center + 3} textAnchor="start" fontSize={8} fill="#888">N</text>
        <text x={svgSize - 5} y={center + 3} textAnchor="end" fontSize={8} fill="#888">T</text>
      </svg>
    </div>
  );
}

function DeviationGrid({ resultMap, field, title }: {
  resultMap: Map<number, { threshold_db: number; total_deviation_db: number; pattern_deviation_db?: number }>;
  field: "total_deviation_db" | "pattern_deviation_db";
  title: string;
}) {
  const cellSize = 22;
  return (
    <div>
      <div className="text-xs font-bold text-gray-700 mb-1 text-center">{title}</div>
      {/* Numerisk deviation */}
      <div className="flex flex-col items-center gap-0 mb-1">
        {GRID_ROWS.map((row, ri) => {
          if (row.points.length === 0) return <div key={ri} className="h-0.5" />;
          const minX = Math.min(...row.points.map(p => p.x));
          const offsetCols = Math.round((minX + 27) / 6);
          return (
            <div key={ri} className="flex" style={{ marginLeft: offsetCols * cellSize }}>
              {row.points.map((pt) => {
                if (pt.bs) return <div key={pt.id} style={{ width: cellSize, height: 16 }} />;
                const r = resultMap.get(pt.id);
                const dev = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
                return (
                  <div key={pt.id} className="text-center font-mono leading-none"
                    style={{ width: cellSize, height: 16, fontSize: 8, color: dev < -5 ? "#c00" : "#333" }}>
                    {dev >= 0 ? `+${Math.round(dev)}` : Math.round(dev)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Probability symbols */}
      <div className="flex flex-col items-center gap-0">
        {GRID_ROWS.map((row, ri) => {
          if (row.points.length === 0) return <div key={ri} className="h-0.5" />;
          const minX = Math.min(...row.points.map(p => p.x));
          const offsetCols = Math.round((minX + 27) / 6);
          return (
            <div key={ri} className="flex" style={{ marginLeft: offsetCols * cellSize }}>
              {row.points.map((pt) => {
                if (pt.bs) return <div key={pt.id} style={{ width: cellSize, height: cellSize }} />;
                const r = resultMap.get(pt.id);
                const dev = r ? (field === "pattern_deviation_db" ? (r.pattern_deviation_db ?? r.total_deviation_db) : r.total_deviation_db) : 0;
                const { shade } = deviationToSymbol(dev);
                return (
                  <div key={pt.id} style={{
                    width: cellSize, height: cellSize,
                    backgroundColor: shade === "transparent" ? "#f5f5f5" : shade,
                    border: "0.5px solid #ddd",
                  }} />
                );
              })}
            </div>
          );
        })}
      </div>
      {/* P-value legende */}
      <div className="flex gap-2 mt-1 text-[9px] text-gray-500 justify-center">
        <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5" style={{background:"#ccc"}} /> &lt;5%</span>
        <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5" style={{background:"#888"}} /> &lt;2%</span>
        <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5" style={{background:"#444"}} /> &lt;1%</span>
        <span className="flex items-center gap-0.5"><span className="w-2.5 h-2.5" style={{background:"#000"}} /> &lt;0.5%</span>
      </div>
    </div>
  );
}

export default function VisualFieldMap({ pointResults, eye }: VisualFieldMapProps) {
  const resultMap = new Map(pointResults.map((p) => [p.grid_point_id, p]));

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">
          Synsfelt — {eye === "OD" ? "Højre øje (OD)" : "Venstre øje (OS)"}
        </h3>
      </div>

      {/* Humphrey-stil 2x2 layout */}
      <div className="grid grid-cols-2 gap-6 justify-items-center">
        {/* Øverst venstre: Numerisk dB */}
        <NumericGrid resultMap={resultMap} title="Numeric Results (dB)" />

        {/* Øverst højre: Grayscale */}
        <GrayscaleGrid resultMap={resultMap} />

        {/* Nederst venstre: Total Deviation */}
        <DeviationGrid resultMap={resultMap} field="total_deviation_db" title="Total Deviation" />

        {/* Nederst højre: Pattern Deviation */}
        <DeviationGrid resultMap={resultMap} field="pattern_deviation_db" title="Pattern Deviation" />
      </div>
    </div>
  );
}
