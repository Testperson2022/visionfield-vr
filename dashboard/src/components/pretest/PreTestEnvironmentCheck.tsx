/**
 * PreTestEnvironmentCheck — Komplet pre-test miljøcheck
 *
 * Flow:
 * 1. Forsøg AmbientLightSensor API
 * 2. Fallback: kamera-estimering
 * 3. Fallback: manuel bekræftelse
 * 4. Vis resultat + bekræftelsesknap
 * 5. Gem resultat og fortsæt til test
 *
 * Touch-venligt, tablet-optimeret.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import AmbientLightCard from "./AmbientLightCard";
import { evaluateAmbientLight, manualLightConfirmation } from "../../screening/ambientLight";
import type { AmbientLightResult } from "../../screening/ambientLight";
import { createAmbientLightSensor, estimateLuxFromCamera, isStable } from "./AmbientLightSensor";

interface Props {
  onComplete: (result: AmbientLightResult) => void;
  onSkip: () => void;
}

type Phase = "measuring" | "result" | "manual" | "camera";

export default function PreTestEnvironmentCheck({ onComplete, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>("measuring");
  const [luxValue, setLuxValue] = useState<number | null>(null);
  const [method, setMethod] = useState<"sensor" | "camera" | "manual" | "unavailable">("unavailable");
  const [result, setResult] = useState<AmbientLightResult | null>(null);
  const [readings, setReadings] = useState<number[]>([]);
  const [sensorStatus, setSensorStatus] = useState<string>("Søger sensor...");
  const sensorRef = useRef<{ stop: () => void } | null>(null);

  // Lag 1: Forsøg AmbientLightSensor
  useEffect(() => {
    const sensor = createAmbientLightSensor(
      (lux) => {
        setLuxValue(lux);
        setMethod("sensor");
        setReadings(prev => [...prev.slice(-9), lux]); // Hold 10 seneste
        setSensorStatus("Sensor aktiv");
      },
      (error) => {
        if (error === "PERMISSION_DENIED") {
          setSensorStatus("Sensor afvist af bruger");
        } else {
          setSensorStatus("Sensor ikke tilgængelig");
        }
        // Gå til lag 2: kamera
        setPhase("camera");
      }
    );

    if (sensor) {
      sensor.start();
      sensorRef.current = sensor;
    } else {
      // Ingen sensor → forsøg kamera
      setSensorStatus("Sensor ikke understøttet");
      setPhase("camera");
    }

    return () => { sensorRef.current?.stop(); };
  }, []);

  // Lag 2: Kamera-estimering
  useEffect(() => {
    if (phase !== "camera") return;

    setSensorStatus("Estimerer via kamera...");
    estimateLuxFromCamera().then(lux => {
      if (lux !== null) {
        setLuxValue(lux);
        setMethod("camera");
        const r = evaluateAmbientLight(lux, "camera");
        setResult(r);
        setPhase("result");
        setSensorStatus("Kamera-estimering fuldført");
      } else {
        // Lag 3: Manuel
        setPhase("manual");
        setSensorStatus("Automatisk måling ikke mulig");
      }
    });
  }, [phase]);

  // Sensor stabilitet check
  useEffect(() => {
    if (method !== "sensor" || readings.length < 5) return;

    if (isStable(readings, 10)) {
      const avgLux = readings.reduce((s, v) => s + v, 0) / readings.length;
      const r = evaluateAmbientLight(avgLux, "sensor");
      setResult(r);
      setPhase("result");
      sensorRef.current?.stop();
    }
  }, [readings, method]);

  // Manuel bekræftelse
  const handleManualConfirm = useCallback((confirmed: boolean) => {
    const r = manualLightConfirmation(confirmed);
    setResult(r);
    setPhase("result");
  }, []);

  // Fortsæt til test
  const handleContinue = useCallback(() => {
    if (result) onComplete(result);
  }, [result, onComplete]);

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
        Kontrol af testforhold
      </h2>
      <p className="text-sm text-gray-500 mb-6 text-center">
        Lysforhold kontrolleres for at sikre testkvalitet
      </p>

      {/* Fase: Måler */}
      {phase === "measuring" && (
        <div className="text-center py-8">
          <div className="animate-pulse text-4xl mb-4">💡</div>
          <p className="text-gray-600">{sensorStatus}</p>
          {luxValue !== null && (
            <p className="text-3xl font-bold text-gray-900 mt-4">{luxValue.toFixed(0)} lux</p>
          )}
          <p className="text-xs text-gray-400 mt-4">Stabiliserer måling...</p>
        </div>
      )}

      {/* Fase: Kamera */}
      {phase === "camera" && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">📷</div>
          <p className="text-gray-600">Estimerer lysforhold via kamera...</p>
          <p className="text-xs text-gray-400 mt-2">Du kan blive bedt om kameratilladelse</p>
        </div>
      )}

      {/* Fase: Manuel fallback */}
      {phase === "manual" && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <h3 className="font-semibold text-amber-800 mb-3">
              Automatisk måling ikke tilgængelig
            </h3>
            <p className="text-sm text-amber-700 mb-4">
              Bekræft venligst at følgende betingelser er opfyldt:
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="text-lg">🔅</span>
                Rummet har dæmpet og stabil belysning
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">☀️</span>
                Ingen direkte sol eller stærke lamper mod skærmen
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">🌙</span>
                Rummet er ikke helt mørkt
              </li>
              <li className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                Belysningen er jævn uden skarpe skygger
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => handleManualConfirm(true)}
              className="flex-1 bg-green-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-green-700 active:bg-green-800 touch-manipulation">
              ✓ Lysforhold er OK
            </button>
            <button onClick={() => handleManualConfirm(false)}
              className="flex-1 bg-red-100 text-red-700 py-4 rounded-xl text-lg font-medium hover:bg-red-200 active:bg-red-300 touch-manipulation">
              ✕ Ikke OK
            </button>
          </div>
        </div>
      )}

      {/* Fase: Resultat */}
      {phase === "result" && result && (
        <div className="space-y-4">
          <AmbientLightCard result={result} />

          <div className="flex gap-3">
            {result.passed ? (
              <button onClick={handleContinue}
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl text-lg font-medium hover:bg-blue-700 active:bg-blue-800 touch-manipulation">
                Fortsæt til test →
              </button>
            ) : (
              <>
                <button onClick={handleContinue}
                  className="flex-1 bg-amber-500 text-white py-4 rounded-xl text-lg font-medium hover:bg-amber-600 touch-manipulation">
                  Fortsæt alligevel
                </button>
                <button onClick={() => { setPhase("measuring"); setReadings([]); setResult(null); }}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 touch-manipulation">
                  Mål igen
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Skip-knap (altid synlig) */}
      <button onClick={onSkip}
        className="w-full mt-4 text-gray-400 text-sm py-2 hover:text-gray-600">
        Spring lys-check over
      </button>

      {/* Disclaimer */}
      <p className="text-[9px] text-gray-400 text-center mt-4">
        Lysforhold påvirker testkvalitet men afgør ikke alene klinisk resultat.
        Screening- og kvalitetsværktøj.
      </p>
    </div>
  );
}
