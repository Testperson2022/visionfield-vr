import { useParams, Link } from "react-router-dom";
import { usePatient } from "../hooks/usePatients";
import { usePatientSessions } from "../hooks/useTestSessions";
import TriageBadge from "../components/TriageBadge";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: patient, isLoading: patientLoading } = usePatient(id!);
  const { data: sessions, isLoading: sessionsLoading } = usePatientSessions(id!);

  if (patientLoading) return <p className="text-gray-500">Indlæser patient...</p>;
  if (!patient) return <p className="text-red-500">Patient ikke fundet</p>;

  return (
    <div>
      <div className="mb-6">
        <Link to="/patients" className="text-sm text-blue-600 hover:text-blue-800">&larr; Tilbage</Link>
        <h2 className="text-2xl font-bold text-gray-900 mt-2">
          {patient.firstName} {patient.lastName}
        </h2>
        <p className="text-gray-500">Fødselsår: {patient.birthYear}</p>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-4">Testhistorik</h3>

      {sessionsLoading ? (
        <p className="text-gray-500">Indlæser tests...</p>
      ) : sessions?.items?.length === 0 ? (
        <p className="text-gray-500">Ingen tests endnu</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Dato</th>
                <th className="px-4 py-3 font-medium text-gray-500">Øje</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">MD</th>
                <th className="px-4 py-3 font-medium text-gray-500">Triage</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions?.items?.map((s: any) => {
                const results = s.results_json;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {new Date(s.started_at).toLocaleDateString("da-DK")}
                    </td>
                    <td className="px-4 py-3 font-mono">{s.eye}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        s.status === "INVALID" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {results?.mean_deviation_db != null
                        ? `${results.mean_deviation_db.toFixed(1)} dB`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {results?.triage_classification ? (
                        <TriageBadge
                          classification={results.triage_classification}
                          showRecommendation={false}
                        />
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(s.status === "COMPLETED" || s.status === "INVALID") && (
                        <Link
                          to={`/test-results/${s.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Se resultater
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
