import { useState } from "react";
import { useAuditLogs } from "../hooks/useAuditLogs";

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Log (GDPR Art. 30)</h2>

      {isLoading ? (
        <p className="text-gray-500">Indlæser...</p>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Tidspunkt</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Bruger</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Handling</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Ressource</th>
                  <th className="px-4 py-3 font-medium text-gray-500">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.items?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">
                      {new Date(log.created_at).toLocaleString("da-DK")}
                    </td>
                    <td className="px-4 py-3">
                      {log.user?.email || log.user_id}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{log.resource}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{log.ip_address}</td>
                  </tr>
                ))}
                {data?.items?.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Ingen audit logs</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {data && data.total > 50 && (
            <div className="flex gap-2 mt-4 justify-center">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50">Forrige</button>
              <span className="px-3 py-1 text-sm text-gray-600">Side {page}</span>
              <button onClick={() => setPage(page + 1)} disabled={page * 50 >= data.total}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50">Næste</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
