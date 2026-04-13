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
              <p className="font-medium text-gray-700">Sløre CPR-numre ved indtastning</p>
              <p className="text-sm text-gray-500">Skjuler de sidste 4 cifre ved søgning og oprettelse (010180-****)</p>
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

      {/* Screening-tærskler */}
      <section className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">Screening-tærskler</h3>
        <p className="text-xs text-gray-500 mb-4">
          Justér sensitivitet for screening-motoren. Lavere værdier = mere følsom (flere fund).
          Standard-værdier er sat til høj sensitivitet for at minimere overset patologi.
        </p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-700 text-xs">Reliability</p>
            <p className="text-[10px] text-gray-500 mt-1">FP godkendt: ≤15% · FP forbehold: ≤33%</p>
            <p className="text-[10px] text-gray-500">FN godkendt: ≤20% · FN forbehold: ≤33%</p>
            <p className="text-[10px] text-gray-500">Fix loss godkendt: ≤15% · Fix loss forbehold: ≤25%</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-700 text-xs">Deviation</p>
            <p className="text-[10px] text-gray-500 mt-1">p&lt;5%: ≤-3 dB · p&lt;2%: ≤-5 dB</p>
            <p className="text-[10px] text-gray-500">p&lt;1%: ≤-7 dB · p&lt;0.5%: ≤-10 dB</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-700 text-xs">Cluster-detektion</p>
            <p className="text-[10px] text-gray-500 mt-1">Min. cluster-størrelse: 3 punkter</p>
            <p className="text-[10px] text-gray-500">Diagonale naboer: Nej (kun ortogonale)</p>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <p className="font-medium text-gray-700 text-xs">Risiko-vurdering</p>
            <p className="text-[10px] text-gray-500 mt-1">Let mistanke: MD ≤-2 dB / PSD ≥2.0</p>
            <p className="text-[10px] text-gray-500">Tydelig mistanke: MD ≤-5 dB / PSD ≥3.5</p>
          </div>
        </div>
        <p className="text-[9px] text-gray-400 mt-3">
          Tærsklerne er defineret i screening/config.ts og kan tilpasses per klinik.
          Kontakt administrator for ændringer.
        </p>
      </section>

      {/* Info */}
      <section className="bg-gray-50 rounded-lg border p-6">
        <h3 className="font-semibold text-gray-900 mb-2">Om VisionField VR</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Version 1.0.0</p>
          <p>Screening- og beslutningsstøtteværktøj</p>
          <p>ZEST-algoritme (King-Smith 1994, Vingrys & Pianta 1999)</p>
          <p>24-2 Humphrey-kompatibelt testgrid</p>
          <p className="text-xs text-gray-400 mt-2">
            Ikke certificeret diagnostisk medicinsk software.
            Resultater skal altid vurderes af kvalificeret fagperson.
          </p>
        </div>
      </section>
    </div>
  );
}
