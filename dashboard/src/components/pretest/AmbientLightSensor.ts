/**
 * Ambient Light Sensor — 3-lags browser-integration
 *
 * Lag 1: AmbientLightSensor API (direkte lux fra hardware)
 * Lag 2: Kamera-estimering (webcam brightness → approx lux)
 * Lag 3: Manuel (fallback)
 *
 * Alle lag returnerer lux-værdi + metode.
 */

export type SensorStatus = "initializing" | "active" | "unavailable" | "denied" | "error";

export interface LightReading {
  lux: number;
  method: "sensor" | "camera" | "manual";
  timestamp: number;
}

/**
 * Forsøg at oprette AmbientLightSensor.
 * Returnerer null hvis ikke understøttet.
 */
export function createAmbientLightSensor(
  onReading: (lux: number) => void,
  onError: (error: string) => void
): { start: () => void; stop: () => void } | null {
  // Feature detection
  if (!("AmbientLightSensor" in window)) {
    return null;
  }

  try {
    // @ts-ignore — AmbientLightSensor ikke i standard TypeScript types
    const sensor = new (window as any).AmbientLightSensor({ frequency: 1 });

    sensor.addEventListener("reading", () => {
      onReading(sensor.illuminance);
    });

    sensor.addEventListener("error", (event: any) => {
      if (event.error.name === "NotAllowedError") {
        onError("PERMISSION_DENIED");
      } else if (event.error.name === "NotReadableError") {
        onError("SENSOR_ERROR");
      } else {
        onError("UNKNOWN_ERROR");
      }
    });

    return {
      start: () => { try { sensor.start(); } catch { onError("START_FAILED"); } },
      stop: () => { try { sensor.stop(); } catch {} },
    };
  } catch {
    return null;
  }
}

/**
 * Kamera-baseret lux-estimering.
 * Tager et snapshot fra webcam og beregner gennemsnitlig luminans.
 * Konverterer til approksimeret lux (IKKE præcis — estimering).
 */
export async function estimateLuxFromCamera(): Promise<number | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: 160, height: 120 },
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;

    await new Promise<void>((resolve) => {
      video.onloadeddata = () => resolve();
    });

    // Vent lidt for at kamera stabiliserer
    await new Promise((r) => setTimeout(r, 500));

    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext("2d");
    if (!ctx) { stream.getTracks().forEach(t => t.stop()); return null; }

    ctx.drawImage(video, 0, 0, 160, 120);
    const imageData = ctx.getImageData(0, 0, 160, 120);
    const data = imageData.data;

    // Beregn gennemsnitlig luminans (0-255)
    let totalLuminance = 0;
    const pixelCount = data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      // Relativ luminans: 0.299R + 0.587G + 0.114B
      totalLuminance += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    const avgLuminance = totalLuminance / pixelCount; // 0-255

    // Stop kamera
    stream.getTracks().forEach(t => t.stop());

    // Konvertér til approksimeret lux
    // VIGTIGT: Dette er en grov estimering, IKKE præcis måling
    // Mapping: 0→0 lux, 128→~50 lux, 255→~500 lux (logaritmisk)
    const normalizedLuminance = avgLuminance / 255;
    const estimatedLux = Math.pow(normalizedLuminance, 2) * 500;

    return Math.round(estimatedLux * 10) / 10;
  } catch {
    return null;
  }
}

/**
 * Stabilitetsvurdering — er lux-værdier stabile over tid?
 */
export function isStable(readings: number[], maxVariance: number): boolean {
  if (readings.length < 3) return false;
  const mean = readings.reduce((s, v) => s + v, 0) / readings.length;
  const variance = readings.reduce((s, v) => s + (v - mean) ** 2, 0) / readings.length;
  return variance <= maxVariance * maxVariance;
}
