import { useState } from "react";
import { useCreatePatient } from "../hooks/usePatients";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePatientModal({ isOpen, onClose }: Props) {
  const [cpr, setCpr] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const createPatient = useCreatePatient();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(
      { cpr, firstName, lastName, birthYear: parseInt(birthYear) },
      {
        onSuccess: () => {
          setCpr(""); setFirstName(""); setLastName(""); setBirthYear("");
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Opret patient</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPR-nummer</label>
            <input
              type="text"
              value={cpr}
              onChange={(e) => setCpr(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="DDMMÅÅXXXX"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={10}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fornavn</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Efternavn</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fødselsår</label>
            <input
              type="number"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              min={1900}
              max={2030}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {createPatient.isError && (
            <p className="text-sm text-red-600">Kunne ikke oprette patient</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
              Annuller
            </button>
            <button type="submit" disabled={createPatient.isPending || cpr.length !== 10}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {createPatient.isPending ? "Opretter..." : "Opret"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
