import { useState } from "react";
import { useCreatePatient } from "../hooks/usePatients";
import { useSettingsStore } from "../store/settingsStore";

/** CPR-input med sløring af de sidste 4 cifre */
function CprInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const maskCpr = useSettingsStore((s) => s.maskCpr);

  // Vis sløret: 010180-**** (kun når feltet ikke er fokuseret)
  const [focused, setFocused] = useState(false);
  const displayValue = (!focused && maskCpr && value.length > 6)
    ? value.slice(0, 6) + "-****"
    : value;

  return (
    <input
      type="text"
      value={focused ? value : displayValue}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
        onChange(raw);
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder="DDMMÅÅ-XXXX"
      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      maxLength={focused ? 10 : 11}
      required
    />
  );
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePatientModal({ isOpen, onClose }: Props) {
  const [patientNumber, setPatientNumber] = useState("");
  const [cpr, setCpr] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const createPatient = useCreatePatient();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPatient.mutate(
      { patientNumber: patientNumber || undefined, cpr, firstName, lastName, birthYear: parseInt(birthYear) },
      {
        onSuccess: () => {
          setPatientNumber(""); setCpr(""); setFirstName(""); setLastName(""); setBirthYear("");
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient-nummer (valgfrit)</label>
            <input
              type="text"
              value={patientNumber}
              onChange={(e) => setPatientNumber(e.target.value)}
              placeholder="Klinik-internt nummer"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPR-nummer</label>
            <CprInput value={cpr} onChange={setCpr} />
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
