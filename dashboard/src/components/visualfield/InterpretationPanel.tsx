/**
 * InterpretationPanel — Klinisk opsummering + mønsteranalyse
 *
 * Viser:
 * - Reliability badge (grøn/gul/rød)
 * - Risikoniveau
 * - Detekterede mønstre (sidepanel)
 * - Maskingeneret klinisk opsummering
 * - Anbefalet handling
 * - Disclaimer
 */
import type { ScreeningResult } from "../../../../shared/screening/types";

interface Props {
  result: ScreeningResult;
}

const reliabilityBadge = {
  good: { bg: "bg-green-100 text-green-800 border-green-300", label: "Godkendt" },
  caution: { bg: "bg-yellow-100 text-yellow-800 border-yellow-300", label: "Brugbar med forbehold" },
  unreliable: { bg: "bg-red-100 text-red-800 border-red-300", label: "Upålidelig — bør gentages" },
};

const riskBadge = {
  normal: { bg: "bg-green-100 text-green-800", label: "Normal", icon: "✓" },
  mild_suspicion: { bg: "bg-yellow-100 text-yellow-800", label: "Let mistanke", icon: "?" },
  clear_suspicion: { bg: "bg-orange-100 text-orange-800", label: "Tydelig mistanke", icon: "!" },
  refer: { bg: "bg-red-100 text-red-800", label: "Bør henvises", icon: "⚠" },
};

const actionText = {
  routine_followup: "Rutinekontrol om 12-24 måneder",
  repeat_test: "Gentag test under bedre betingelser",
  extended_exam: "Udvidet undersøgelse med fuld perimetri",
  refer_glaucoma: "Henvisning til øjenlæge — glaukommistanke",
  refer_neuro: "Neurologisk vurdering anbefales",
  refer_urgent: "AKUT henvisning",
};

export default function InterpretationPanel({ result }: Props) {
  const rel = reliabilityBadge[result.reliability.grade];
  const risk = riskBadge[result.riskLevel];

  return (
    <div className="space-y-4">
      {/* Reliability */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-700">Testkvalitet</h4>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${rel.bg}`}>{rel.label}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>False Pos: <span className="font-mono">{(result.reliability.falsePositiveRate * 100).toFixed(0)}%</span></div>
          <div>False Neg: <span className="font-mono">{(result.reliability.falseNegativeRate * 100).toFixed(0)}%</span></div>
          <div>Fix Loss: <span className="font-mono">{(result.reliability.fixationLossRate * 100).toFixed(0)}%</span></div>
          <div>Komplet: <span className="font-mono">{(result.reliability.completionRate * 100).toFixed(0)}%</span></div>
        </div>
        {result.reliability.issues.length > 0 && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
            {result.reliability.issues.map((issue, i) => <p key={i}>⚠ {issue}</p>)}
          </div>
        )}
      </div>

      {/* Risikovurdering */}
      <div className="bg-white rounded-lg border p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Screening-resultat</h4>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${risk.bg}`}>
          <span className="text-lg">{risk.icon}</span>
          <span className="font-semibold">{risk.label}</span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          MD: <span className="font-mono font-bold">{result.globalIndices.meanDeviationDb.toFixed(1)} dB</span>
          {" · "}
          PSD: <span className="font-mono font-bold">{result.globalIndices.patternStdDeviationDb.toFixed(1)} dB</span>
        </p>
      </div>

      {/* Mønstre */}
      {result.patterns.detectedPatterns.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Detekterede mønstre</h4>
          <div className="space-y-1">
            {result.patterns.detectedPatterns.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <span>{p}</span>
              </div>
            ))}
          </div>
          {/* Mønster-indikatorer */}
          <div className="grid grid-cols-2 gap-1 mt-3 text-[10px]">
            <div className={`px-2 py-1 rounded ${result.patterns.hemifieldAsymmetry ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-400"}`}>
              Hemifield asymmetri: {result.patterns.hemifieldAsymmetry ? "Ja" : "Nej"}
            </div>
            <div className={`px-2 py-1 rounded ${result.patterns.respectsVerticalMeridian ? "bg-red-100 text-red-800" : "bg-gray-50 text-gray-400"}`}>
              Vertikal midtlinje: {result.patterns.respectsVerticalMeridian ? "Ja ⚠" : "Nej"}
            </div>
            <div className={`px-2 py-1 rounded ${result.patterns.generalizedDepression ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-400"}`}>
              Generel depression: {result.patterns.generalizedDepression ? "Ja" : "Nej"}
            </div>
            <div className={`px-2 py-1 rounded ${result.patterns.arcuatePattern ? "bg-amber-100 text-amber-800" : "bg-gray-50 text-gray-400"}`}>
              Arkuat defekt: {result.patterns.arcuatePattern ? "Ja" : "Nej"}
            </div>
          </div>
        </div>
      )}

      {/* Klinisk opsummering */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Klinisk opsummering</h4>
        <p className="text-sm text-blue-800 leading-relaxed">{result.clinicalSummary}</p>
      </div>

      {/* Anbefaling */}
      <div className={`rounded-lg border p-4 ${
        result.recommendedAction.startsWith("refer") ? "bg-red-50 border-red-200" :
        result.recommendedAction === "repeat_test" ? "bg-yellow-50 border-yellow-200" :
        "bg-green-50 border-green-200"
      }`}>
        <h4 className="text-sm font-semibold mb-1">Anbefalet handling</h4>
        <p className="text-sm font-medium">{actionText[result.recommendedAction]}</p>
      </div>

      {/* Disclaimer */}
      <div className="rounded border border-gray-200 p-3 bg-gray-50">
        <p className="text-[10px] text-gray-500 leading-relaxed">
          {result.disclaimer}
        </p>
        <p className="text-[9px] text-gray-400 mt-1">
          Algoritme v{result.algorithmVersion} · Analyseret {new Date(result.analyzedAt).toLocaleString("da-DK")}
        </p>
      </div>
    </div>
  );
}
