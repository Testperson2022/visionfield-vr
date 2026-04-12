import { useState } from "react";
import { useDevices, useRegisterDevice } from "../hooks/useDevices";

export default function DevicesPage() {
  const { data: devices, isLoading } = useDevices();
  const registerDevice = useRegisterDevice();
  const [showForm, setShowForm] = useState(false);
  const [model, setModel] = useState("Meta Quest 3");
  const [serial, setSerial] = useState("");
  const [firmware, setFirmware] = useState("");

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerDevice.mutate({ model, serial, firmware }, {
      onSuccess: () => { setSerial(""); setFirmware(""); setShowForm(false); },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Enheder</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
        >
          {showForm ? "Annuller" : "Registrer enhed"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleRegister} className="bg-white rounded-lg border p-4 mb-6 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input value={model} onChange={(e) => setModel(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serienummer</label>
              <input value={serial} onChange={(e) => setSerial(e.target.value)}
                placeholder="MQ3-XXX-XXX" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firmware</label>
              <input value={firmware} onChange={(e) => setFirmware(e.target.value)}
                placeholder="62.0.0" className="w-full border rounded-lg px-3 py-2 text-sm" required />
            </div>
          </div>
          <button type="submit" disabled={registerDevice.isPending}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
            {registerDevice.isPending ? "Registrerer..." : "Registrer"}
          </button>
        </form>
      )}

      {isLoading ? (
        <p className="text-gray-500">Indlæser enheder...</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Model</th>
                <th className="px-4 py-3 font-medium text-gray-500">Serienummer</th>
                <th className="px-4 py-3 font-medium text-gray-500">Firmware</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {devices?.map((d: any) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.headset_model}</td>
                  <td className="px-4 py-3 font-mono text-gray-600">{d.headset_serial}</td>
                  <td className="px-4 py-3 text-gray-600">{d.firmware_version}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      d.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {d.is_active ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                </tr>
              ))}
              {devices?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Ingen enheder registreret</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
