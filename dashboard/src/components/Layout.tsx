import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../store/authStore";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/patients", label: t("nav.patients") },
    { path: "/monitor", label: "Live Monitor" },
    { path: "/devices", label: t("nav.devices") },
    ...(user?.role === "ADMIN" ? [{ path: "/audit-logs", label: t("nav.auditLog") }] : []),
  ];

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">{t("app.title")}</h1>
          <p className="text-sm text-gray-400 mt-1">{t("app.subtitle")}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg text-sm ${
                (item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path))
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <LanguageSwitcher />
          </div>
          <button
            onClick={logout}
            className="text-sm text-red-400 hover:text-red-300"
          >
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
