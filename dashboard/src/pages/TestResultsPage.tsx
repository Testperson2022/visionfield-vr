import { useParams, Link } from "react-router-dom";
import { useTestSession } from "../hooks/useTestSessions";
import VisualFieldMap from "../components/VisualFieldMap";
import TriageBadge from "../components/TriageBadge";
import QualityMetricsCard from "../components/QualityMetricsCard";

export default function TestResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading } = useTestSession(sessionId!);

  if (isLoading) return <p className="text-gray-500">Indlæser resultater...</p>;
  if (!session) return <p className="text-red-500">Session ikke fundet</p>;

  const results = session.results_json as any;
  if (!results) return <p className="text-gray-500">Ingen resultater tilgængelige</p>;

  return (
    <div>
      <Link to={`/patients/${session.patient_id}`} className="text-sm text-blue-600 hover:text-blue-800">
        &larr; Tilbage til patient
      </Link>

      <div className="mt-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Testresultater</h2>
        <p className="text-gray-500">
          {new Date(session.started_at).toLocaleDateString("da-DK")}{" "}
          — {session.eye === "OD" ? "Højre øje" : "Venstre øje"} ({session.eye})
        </p>
      </div>

      {/* Triage + globale indices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Triage</h3>
          <TriageBadge
            classification={results.triage_classification}
            recommendation={results.triage_recommendation}
          />
        </div>

        <div className="bg-white rounded-lg border p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Globale indices</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean Deviation (MD)</span>
              <span className="font-mono font-bold">{results.mean_deviation_db?.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pattern SD (PSD)</span>
              <span className="font-mono font-bold">{results.pattern_sd_db?.toFixed(1)} dB</span>
            </div>
            {results.ght && (
              <div className="flex justify-between">
                <span className="text-gray-600">GHT</span>
                <span className="font-mono text-sm">{results.ght}</span>
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
        <VisualFieldMap
          pointResults={results.point_results}
          eye={session.eye}
        />
      )}
    </div>
  );
}
