import { useState } from "react";
import { useSearchPatient } from "../hooks/usePatients";
import { useNavigate } from "react-router-dom";
import { useSettingsStore } from "../store/settingsStore";

export default function PatientSearchBar() {
  const [cpr, setCpr] = useState("");
  const [focused, setFocused] = useState(false);
  const maskCpr = useSettingsStore((s) => s.maskCpr);
  const search = useSearchPatient();
  const navigate = useNavigate();

  const handleSearch = () => {
    if (cpr.length !== 10) return;
    search.mutate(cpr, {
      onSuccess: (patient) => {
        if (patient) navigate(`/patients/${patient.id}`);
      },
    });
  };

  // Sløre de sidste 4 cifre når ikke fokuseret
  const displayValue = (!focused && maskCpr && cpr.length > 6)
    ? cpr.slice(0, 6) + "-****"
    : cpr;

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={focused ? cpr : displayValue}
        onChange={(e) => setCpr(e.target.value.replace(/\D/g, "").slice(0, 10))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="CPR-nummer (10 cifre)"
        className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        maxLength={focused ? 10 : 11}
      />
      <button
        onClick={handleSearch}
        disabled={cpr.length !== 10 || search.isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {search.isPending ? "Søger..." : "Søg"}
      </button>
      {search.isSuccess && !search.data && (
        <span className="text-sm text-gray-500 self-center">Ingen patient fundet</span>
      )}
    </div>
  );
}
