import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import PatientsPage from "./pages/PatientsPage";
import PatientDetailPage from "./pages/PatientDetailPage";
import TestResultsPage from "./pages/TestResultsPage";
import DevicesPage from "./pages/DevicesPage";
import AuditLogPage from "./pages/AuditLogPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import OperatorMonitorPage from "./pages/OperatorMonitorPage";

export default function App() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/patients" replace />} />
        <Route path="/patients" element={<PatientsPage />} />
        <Route path="/patients/:id" element={<PatientDetailPage />} />
        <Route path="/test-results/:sessionId" element={<TestResultsPage />} />
        <Route path="/devices" element={<DevicesPage />} />
        <Route path="/monitor" element={<OperatorMonitorPage />} />
        {user?.role === "ADMIN" && (
          <Route path="/audit-logs" element={<AuditLogPage />} />
        )}
        <Route path="*" element={<Navigate to="/patients" replace />} />
      </Routes>
    </Layout>
  );
}
