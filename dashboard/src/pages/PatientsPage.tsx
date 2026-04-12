import { useState } from "react";
import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import PatientSearchBar from "../components/PatientSearchBar";

export default function PatientsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = usePatients(page);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Patienter</h2>
        <PatientSearchBar />
      </div>

      {isLoading ? (
        <p className="text-gray-500">Indlæser...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Navn</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Fødselsår</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Oprettet</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.birthYear}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(p.createdAt).toLocaleDateString("da-DK")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/patients/${p.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Se tests
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.total > 20 && (
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Forrige
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Side {page} af {Math.ceil(data.total / 20)}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * 20 >= data.total}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                Næste
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
