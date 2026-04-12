import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: "/patients", label: "Patienter" },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">VisionField VR</h1>
          <p className="text-sm text-gray-400 mt-1">Kliniker Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg text-sm ${
                location.pathname.startsWith(item.path)
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <p className="text-sm text-gray-400">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          <button
            onClick={logout}
            className="mt-2 text-sm text-red-400 hover:text-red-300"
          >
            Log ud
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
