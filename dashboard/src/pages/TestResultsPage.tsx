/**
 * TestResultsPage — Komplet screenings-resultatvisning
 *
 * Integrerer:
 * - Screening engine (analyse + mønstergenkendelse)
 * - SVG Visual Field Chart (lagdelt, interaktiv)
 * - InterpretationPanel (klinisk opsummering)
 * - Øje-switcher (OD / OS / Begge)
 * - PDF download
 * - Disclaimer
 */
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTestSession, usePatientSessions } from "../hooks/useTestSessions";
import { useScreeningAnalysis } from "../hooks/useScreeningAnalysis";
import VisualFieldChart from "../components/visualfield/VisualFieldChart";
import InterpretationPanel from "../components/visualfield/InterpretationPanel";
import VisualFieldMap from "../components/VisualFieldMap";
import api from "../utils/api";

type ViewMode = "single" | "both";

function EyeResultPanel({ session }: { session: any }) {
  const screening = useScreeningAnalysis(session);

  if (!screening) {
    return <p className="text-gray-400 text-sm p-4">Ingen resultater tilgængelige</p>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
      {/* Venstre: SVG Chart */}
      <div>
        <VisualFieldChart result={screening} eye={session.eye} />

        {/* Humphrey-stil printout (kan foldes ud) */}
        <details className="mt-4">
          <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
            Vis klassisk Humphrey-printout
          </summary>
          <div className="mt-2">
            <VisualFieldMap
              pointResults={session.results_json.point_results}
              eye={session.eye}
            />
          </div>
        </details>
      </div>

      {/* Højre: Interpretation Panel */}
      <InterpretationPanel result={screening} />
    </div>
  );
}

export default function TestResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useTestSession(sessionId!);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedEye, setSelectedEye] = useState<"OD" | "OS" | null>(null);

  const patientSessions = usePatientSessions(session?.patient_id ?? "", 1);
  const allSessions = patientSessions.data?.items ?? [];

  if (isLoading) return <p className="text-gray-500 p-8">Indlæser resultater...</p>;
  if (!session) return <p className="text-red-500 p-8">Session ikke fundet</p>;

  const odSession = allSessions.find((s: any) => s.eye === "OD" && (s.status === "COMPLETED" || s.status === "INVALID"));
  const osSession = allSessions.find((s: any) => s.eye === "OS" && (s.status === "COMPLETED" || s.status === "INVALID"));

  const activeEye = selectedEye ?? session.eye;
  const activeSession = activeEye === "OD" ? odSession : osSession;

  return (
    <div>
      <Link to={`/patients/${session.patient_id}`} className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Tilbage til patient
      </Link>

      {/* Header */}
      <div className="mt-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Screeningsresultat</h2>
          <p className="text-gray-500 text-sm">
            {new Date(session.started_at).toLocaleDateString("da-DK")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Øje-tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => { setViewMode("single"); setSelectedEye("OD"); }}
              disabled={!odSession}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "single" && activeEye === "OD"
                  ? "bg-blue-600 text-white" : odSession ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}>OD</button>
            <button onClick={() => { setViewMode("single"); setSelectedEye("OS"); }}
              disabled={!osSession}
              className={`px-3 py-1.5 text-sm font-medium border-x ${
                viewMode === "single" && activeEye === "OS"
                  ? "bg-blue-600 text-white" : osSession ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}>OS</button>
            <button onClick={() => setViewMode("both")}
              disabled={!odSession || !osSession}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === "both"
                  ? "bg-blue-600 text-white" : (odSession && osSession) ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}>Begge</button>
          </div>

          {/* Handlingsknapper */}
          <div className="flex gap-2">
            <button onClick={async () => {
                const sid = activeSession?.id ?? sessionId;
                const { data } = await api.get(`/api/reports/${sid}/pdf`, { responseType: "blob" });
                const url = window.URL.createObjectURL(new Blob([data]));
                const a = document.createElement("a"); a.href = url;
                a.download = `screening-${sid}.pdf`; a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800">
              PDF
            </button>
            <button onClick={() => {
                const sid = activeSession?.id ?? sessionId;
                api.get(`/api/export/${sid}/json`).then(({ data }) => {
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url;
                  a.download = `screening-${sid}.json`; a.click();
                  window.URL.revokeObjectURL(url);
                });
              }}
              className="bg-white border text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
              JSON
            </button>
            <button onClick={() => window.print()}
              className="bg-white border text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-50">
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Resultat */}
      {viewMode === "both" ? (
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          {odSession && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Højre øje (OD)</h3>
              <EyeResultPanel session={odSession} />
            </div>
          )}
          {osSession && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">Venstre øje (OS)</h3>
              <EyeResultPanel session={osSession} />
            </div>
          )}
        </div>
      ) : activeSession ? (
        <EyeResultPanel session={activeSession} />
      ) : (
        <p className="text-gray-500">Ingen test for {activeEye === "OD" ? "højre" : "venstre"} øje</p>
      )}

      {/* Disclaimer — altid synlig nederst */}
      <div className="mt-8 rounded border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 text-lg">⚠</span>
          <div>
            <p className="text-sm font-medium text-amber-800">Screening — ikke diagnostisk software</p>
            <p className="text-xs text-amber-700 mt-1">
              Dette resultat er et screenings- og beslutningsstøtteværktøj.
              Resultatet erstatter ikke en fuld klinisk undersøgelse og skal altid
              vurderes af en kvalificeret fagperson. Ved mistanke om synsfeltdefekt
              anbefales henvisning til øjenlæge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
