import { useState } from "react";
import { useSearchPatient } from "../hooks/usePatients";
import { useNavigate } from "react-router-dom";

export default function PatientSearchBar() {
  const [cpr, setCpr] = useState("");
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

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={cpr}
        onChange={(e) => setCpr(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="CPR-nummer (10 cifre)"
        className="border rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        maxLength={10}
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
