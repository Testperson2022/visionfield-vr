import { useSettingsStore } from "../store/settingsStore";

export default function SettingsPage() {
  const {
    maskCpr, setMaskCpr,
    soundOnResponse, setSoundOnResponse,
    soundVolume, setSoundVolume,
    showPatientNumber, setShowPatientNumber,
  } = useSettingsStore();

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Indstillinger</h2>

      {/* Privacy */}
      <section className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Privatliv & Sikkerhed</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Sløre CPR-numre</p>
              <p className="text-sm text-gray-500">Viser kun de sidste 4 cifre (XXXXXX-1234)</p>
            </div>
            <input
              type="checkbox"
              checked={maskCpr}
              onChange={(e) => setMaskCpr(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Vis patient-nummer</p>
              <p className="text-sm text-gray-500">Viser klinik-internt patient-nummer i listen</p>
            </div>
            <input
              type="checkbox"
              checked={showPatientNumber}
              onChange={(e) => setShowPatientNumber(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>
        </div>
      </section>

      {/* Test-indstillinger */}
      <section className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Test-indstillinger</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-700">Lyd ved respons</p>
              <p className="text-sm text-gray-500">Afspil en kort lyd når patienten trykker under test</p>
            </div>
            <input
              type="checkbox"
              checked={soundOnResponse}
              onChange={(e) => setSoundOnResponse(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
          </label>

          {soundOnResponse && (
            <div>
              <label className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Lydstyrke</span>
                <span className="text-sm font-mono text-gray-500">{soundVolume}%</span>
              </label>
              <input
                type="range"
                min={0} max={100}
                value={soundVolume}
                onChange={(e) => setSoundVolume(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </section>

      {/* Info */}
      <section className="bg-gray-50 rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Om VisionField VR</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Version 1.0.0</p>
          <p>Klasse IIa medicinsk software (MDR 2017/745)</p>
          <p>ZEST-algoritme (King-Smith 1994, Vingrys & Pianta 1999)</p>
          <p>24-2 Humphrey-kompatibelt testgrid</p>
        </div>
      </section>
    </div>
  );
}
