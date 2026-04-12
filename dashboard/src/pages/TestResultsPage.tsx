import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTestSession, usePatientSessions } from "../hooks/useTestSessions";
import VisualFieldMap from "../components/VisualFieldMap";
import TriageBadge from "../components/TriageBadge";
import QualityMetricsCard from "../components/QualityMetricsCard";
import api from "../utils/api";

type ViewMode = "single" | "both";

/** Enkelt øje-resultat panel */
function EyeResult({ session }: { session: any }) {
  const results = session.results_json as any;
  if (!results) return <p className="text-gray-400 text-sm">Ingen resultater</p>;

  return (
    <div>
      {/* Triage + indices + kvalitet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-lg border p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Triage</h4>
          <TriageBadge
            classification={results.triage_classification}
            recommendation={results.triage_recommendation}
          />
        </div>
        <div className="bg-white rounded-lg border p-3">
          <h4 className="text-xs font-medium text-gray-500 mb-1">Globale indices</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">MD</span>
              <span className="font-mono font-bold">{results.mean_deviation_db?.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">PSD</span>
              <span className="font-mono font-bold">{results.pattern_sd_db?.toFixed(1)} dB</span>
            </div>
            {results.ght && (
              <div className="flex justify-between">
                <span className="text-gray-600">GHT</span>
                <span className="font-mono text-xs">{results.ght}</span>
              </div>
            )}
          </div>
        </div>
        <QualityMetricsCard
          falsePositiveRate={session.false_positive_rate ?? 0}
          falseNegativeRate={session.false_negative_rate ?? 0}
          fixationLossRate={session.fixation_loss_rate ?? 0}
          testDurationSeconds={session.test_duration_seconds ?? 0}
          isReliable={session.is_reliable ?? true}
          reliabilityIssues={[]}
        />
      </div>

      {/* Synsfeltskort */}
      {results.point_results && (
        <VisualFieldMap pointResults={results.point_results} eye={session.eye} />
      )}
    </div>
  );
}

export default function TestResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useTestSession(sessionId!);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [selectedEye, setSelectedEye] = useState<"OD" | "OS" | null>(null);

  // Hent alle sessions for denne patient for at finde det andet øje
  const patientSessions = usePatientSessions(session?.patient_id ?? "", 1);
  const allSessions = patientSessions.data?.items ?? [];

  if (isLoading) return <p className="text-gray-500">Indlæser resultater...</p>;
  if (!session) return <p className="text-red-500">Session ikke fundet</p>;

  // Find sessions for begge øjne (seneste per øje)
  const odSession = allSessions.find((s: any) => s.eye === "OD" && (s.status === "COMPLETED" || s.status === "INVALID"));
  const osSession = allSessions.find((s: any) => s.eye === "OS" && (s.status === "COMPLETED" || s.status === "INVALID"));

  // Default til det øje der blev klikket på
  const activeEye = selectedEye ?? session.eye;
  const activeSession = activeEye === "OD" ? odSession : osSession;

  return (
    <div>
      <Link to={`/patients/${session.patient_id}`} className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Tilbage til patient
      </Link>

      {/* Header med øje-switcher */}
      <div className="mt-4 mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Testresultater</h2>
          <p className="text-gray-500">
            {new Date(session.started_at).toLocaleDateString("da-DK")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Øje-tabs */}
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => { setViewMode("single"); setSelectedEye("OD"); }}
              disabled={!odSession}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "single" && activeEye === "OD"
                  ? "bg-blue-600 text-white"
                  : odSession ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}
            >
              OD (Højre)
            </button>
            <button
              onClick={() => { setViewMode("single"); setSelectedEye("OS"); }}
              disabled={!osSession}
              className={`px-4 py-2 text-sm font-medium border-x ${
                viewMode === "single" && activeEye === "OS"
                  ? "bg-blue-600 text-white"
                  : osSession ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}
            >
              OS (Venstre)
            </button>
            <button
              onClick={() => setViewMode("both")}
              disabled={!odSession || !osSession}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === "both"
                  ? "bg-blue-600 text-white"
                  : (odSession && osSession) ? "bg-white text-gray-700 hover:bg-gray-50" : "bg-gray-100 text-gray-400"
              }`}
            >
              Begge øjne
            </button>
          </div>

          {/* PDF download */}
          <button
            onClick={async () => {
              const sid = activeSession?.id ?? sessionId;
              const { data } = await api.get(`/api/reports/${sid}/pdf`, { responseType: "blob" });
              const url = window.URL.createObjectURL(new Blob([data]));
              const a = document.createElement("a");
              a.href = url;
              a.download = `visionfield-${sid}.pdf`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Indhold */}
      {viewMode === "both" ? (
        /* Begge øjne side om side */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {odSession && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                Højre øje (OD)
              </h3>
              <EyeResult session={odSession} />
            </div>
          )}
          {osSession && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">
                Venstre øje (OS)
              </h3>
              <EyeResult session={osSession} />
            </div>
          )}
        </div>
      ) : (
        /* Enkelt øje */
        activeSession ? (
          <EyeResult session={activeSession} />
        ) : (
          <p className="text-gray-500">Ingen test for {activeEye === "OD" ? "højre" : "venstre"} øje</p>
        )
      )}
    </div>
  );
}
