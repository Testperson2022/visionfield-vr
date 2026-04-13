/**
 * AmbientLightCard — Vis lysniveau med status-indikator
 *
 * Viser:
 * - Lux-værdi (stor, tydelig)
 * - Status badge (Optimal / Forbehold / Utilstrækkelig)
 * - Anbefalet interval
 * - Instruktion hvis nødvendigt
 * - Metode-indikator (sensor/kamera/manuel)
 */
import type { AmbientLightResult } from "../../screening/ambientLight";

interface Props {
  result: AmbientLightResult;
  isLive?: boolean;
}

const STATUS_CONFIG = {
  optimal: { bg: "bg-green-50 border-green-300", text: "text-green-800", icon: "✓", label: "Optimal" },
  caution: { bg: "bg-yellow-50 border-yellow-300", text: "text-yellow-800", icon: "⚠", label: "Forbehold" },
  poor:    { bg: "bg-red-50 border-red-300", text: "text-red-800", icon: "✕", label: "Utilstrækkelig" },
  unknown: { bg: "bg-gray-50 border-gray-300", text: "text-gray-600", icon: "?", label: "Ukendt" },
};

const METHOD_LABELS = {
  sensor: "Hardware-sensor",
  camera: "Kamera-estimering",
  manual: "Manuel bekræftelse",
  unavailable: "Ikke målt",
};

export default function AmbientLightCard({ result, isLive }: Props) {
  const sc = STATUS_CONFIG[result.status];

  return (
    <div className={`rounded-xl border-2 p-6 ${sc.bg} transition-all`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">Lysforhold</h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${sc.bg} ${sc.text}`}>
            {sc.icon} {sc.label}
          </span>
        </div>
      </div>

      {/* Lux-værdi */}
      <div className="text-center mb-4">
        {result.lux !== null ? (
          <>
            <div className={`text-5xl font-bold ${sc.text}`}>
              {result.lux.toFixed(0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">lux</div>
          </>
        ) : (
          <div className="text-2xl text-gray-400">—</div>
        )}
      </div>

      {/* Anbefalet interval */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <div className="h-2 w-8 rounded-l bg-red-300" title="<5 lux" />
        <div className="h-2 w-6 rounded-none bg-yellow-300" title="5-10 lux" />
        <div className="h-2 w-16 rounded-none bg-green-400 relative" title="10-50 lux">
          {result.lux !== null && result.lux >= 5 && result.lux <= 80 && (
            <div className="absolute top-[-6px] w-0.5 h-5 bg-gray-800"
              style={{ left: `${Math.min(100, Math.max(0, ((result.lux - 5) / 75) * 100))}%` }} />
          )}
        </div>
        <div className="h-2 w-6 rounded-none bg-yellow-300" title="50-80 lux" />
        <div className="h-2 w-8 rounded-r bg-red-300" title=">80 lux" />
      </div>
      <div className="flex justify-between text-[9px] text-gray-400 px-1">
        <span>0</span>
        <span>10</span>
        <span>50</span>
        <span>80+</span>
      </div>

      {/* Besked + instruktion */}
      <p className={`text-sm font-medium mt-3 ${sc.text}`}>{result.message}</p>
      {result.instruction && (
        <p className="text-sm text-gray-600 mt-2 bg-white/60 rounded p-2">
          💡 {result.instruction}
        </p>
      )}

      {/* Metode */}
      <div className="mt-3 text-xs text-gray-400 text-right">
        Metode: {METHOD_LABELS[result.method]}
      </div>
    </div>
  );
}
