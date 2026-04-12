import { Link } from "react-router-dom";
import { usePatients } from "../hooks/usePatients";
import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data } = usePatients(1);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Godmorgen" : hour < 18 ? "God eftermiddag" : "Godaften";

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {greeting}, {user?.email?.split("@")[0]}
        </h2>
        <p className="text-gray-500 mt-1">VisionField VR — Kliniker Dashboard</p>
      </div>

      {/* Hurtig-genveje */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/patients"
          className="bg-white rounded-xl border-2 border-blue-100 hover:border-blue-400 p-6 transition-colors">
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-bold text-gray-900 text-lg">Patienter</h3>
          <p className="text-sm text-gray-500 mt-1">
            {data?.total ?? 0} registrerede patienter
          </p>
          <p className="text-blue-600 text-sm mt-3 font-medium">Se patientliste →</p>
        </Link>

        <Link to="/monitor"
          className="bg-white rounded-xl border-2 border-green-100 hover:border-green-400 p-6 transition-colors">
          <div className="text-3xl mb-3">📡</div>
          <h3 className="font-bold text-gray-900 text-lg">Live Monitor</h3>
          <p className="text-sm text-gray-500 mt-1">
            Overvåg synsfeltstest i realtid
          </p>
          <p className="text-green-600 text-sm mt-3 font-medium">Åbn monitor →</p>
        </Link>

        <Link to="/devices"
          className="bg-white rounded-xl border-2 border-gray-100 hover:border-gray-400 p-6 transition-colors">
          <div className="text-3xl mb-3">🥽</div>
          <h3 className="font-bold text-gray-900 text-lg">Enheder</h3>
          <p className="text-sm text-gray-500 mt-1">
            Administrer VR-headsets og kalibrering
          </p>
          <p className="text-gray-600 text-sm mt-3 font-medium">Se enheder →</p>
        </Link>
      </div>

      {/* Seneste patienter */}
      {data?.items && data.items.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Seneste patienter</h3>
          </div>
          <div>
            {data.items.slice(0, 5).map((p: any) => (
              <Link key={p.id} to={`/patients/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 border-b last:border-0">
                <div>
                  <span className="font-medium text-gray-900">{p.firstName} {p.lastName}</span>
                  <span className="text-gray-400 text-sm ml-3">f. {p.birthYear}</span>
                </div>
                <span className="text-blue-600 text-sm">Se tests →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
