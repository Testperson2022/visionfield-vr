import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setError("Kunne ikke sende reset-link. Prøv igen.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Glemt adgangskode</h1>
        </div>

        {sent ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <p className="text-green-700 mb-4">Hvis emailen findes, er et reset-link sendt.</p>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 text-sm">
              Tilbage til login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
              Send reset-link
            </button>
            <Link to="/login" className="block text-center text-sm text-blue-600 hover:text-blue-800">
              Tilbage til login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
