/**
 * Ambient Light Evaluation — Lysforhold-vurdering
 *
 * 3-lags system:
 * 1. AmbientLightSensor API (direkte lux)
 * 2. Kamera-estimering (webcam luminans → approx lux)
 * 3. Manuel bekræftelse (optiker visuelt check)
 *
 * Tærskler er konfigurerbare — ingen hardcoded værdier.
 *
 * VIGTIGT: Lys-check forbedrer testkvalitet, men afgør ikke
 * alene klinisk resultat. Det er et kvalitetsværktøj.
 */

// ─── Konfiguration ────────────────────────────────────────────

export interface AmbientLightConfig {
  /** Under denne værdi: for mørkt */
  tooLowLux: number;
  /** Lav men muligvis brugbar */
  lowLux: number;
  /** Øvre grænse for optimalt */
  optimalMaxLux: number;
  /** Over denne: for lyst */
  tooHighLux: number;
  /** Antal sekunder sensor skal være stabil før godkendelse */
  stabilityWindowSec: number;
  /** Max varians i stabilitetvindue (lux) */
  stabilityMaxVariance: number;
  /** Reliability modifier for hvert niveau */
  reliabilityModifiers: {
    optimal: number;
    caution: number;
    poor: number;
    unknown: number;
  };
}

export const DEFAULT_AMBIENT_LIGHT_CONFIG: AmbientLightConfig = {
  tooLowLux: 5,
  lowLux: 10,
  optimalMaxLux: 50,
  tooHighLux: 80,
  stabilityWindowSec: 3,
  stabilityMaxVariance: 10,
  reliabilityModifiers: {
    optimal: 0,
    caution: -5,
    poor: -15,
    unknown: -5,
  },
};

// ─── Typer ────────────────────────────────────────────────────

export type AmbientLightStatus = "optimal" | "caution" | "poor" | "unknown";
export type AmbientLightMethod = "sensor" | "camera" | "manual" | "unavailable";
export type AmbientLightWarning =
  | "TOO_DARK"
  | "TOO_BRIGHT"
  | "LOW_LIGHT"
  | "HIGH_LIGHT"
  | "SENSOR_UNAVAILABLE"
  | "UNSTABLE"
  | "PERMISSION_DENIED"
  | null;

export interface AmbientLightResult {
  /** Målt/estimeret lux-værdi (null hvis ukendt) */
  lux: number | null;
  /** Vurdering */
  status: AmbientLightStatus;
  /** Metode brugt til måling */
  method: AmbientLightMethod;
  /** Tidspunkt */
  checkedAt: string;
  /** Eventuelt notat */
  note: string | null;
  /** Bestået pre-test check */
  passed: boolean;
  /** Advarselskode */
  warningCode: AmbientLightWarning;
  /** Beskrivende tekst til UI */
  message: string;
  /** Instruktion til bruger */
  instruction: string | null;
  /** Reliability modifier (tilføjes til samlet score) */
  reliabilityModifier: number;
}

// ─── Evaluering ───────────────────────────────────────────────

/**
 * Evaluer lysniveau og returnér struktureret resultat.
 * Ingen magiske tal — alt fra config.
 */
export function evaluateAmbientLight(
  lux: number | null,
  method: AmbientLightMethod,
  config: AmbientLightConfig = DEFAULT_AMBIENT_LIGHT_CONFIG
): AmbientLightResult {
  const now = new Date().toISOString();

  // Ukendt måling
  if (lux === null || method === "unavailable") {
    return {
      lux: null,
      status: "unknown",
      method: method || "unavailable",
      checkedAt: now,
      note: null,
      passed: false,
      warningCode: "SENSOR_UNAVAILABLE",
      message: "Lysforhold kunne ikke måles automatisk.",
      instruction: "Bekræft at rummet har dæmpet og stabil belysning.",
      reliabilityModifier: config.reliabilityModifiers.unknown,
    };
  }

  // For mørkt
  if (lux < config.tooLowLux) {
    return {
      lux, status: "poor", method, checkedAt: now, note: null,
      passed: false,
      warningCode: "TOO_DARK",
      message: `Lysforhold: ${lux.toFixed(0)} lux — For mørkt`,
      instruction: "Tænd en dæmpet lampe for at nå 10-50 lux.",
      reliabilityModifier: config.reliabilityModifiers.poor,
    };
  }

  // Lavt men muligt brugbart
  if (lux < config.lowLux) {
    return {
      lux, status: "caution", method, checkedAt: now, note: null,
      passed: true,
      warningCode: "LOW_LIGHT",
      message: `Lysforhold: ${lux.toFixed(0)} lux — Lavt`,
      instruction: "Lysniveauet er lavt. Øg belysningen lidt for bedre kvalitet.",
      reliabilityModifier: config.reliabilityModifiers.caution,
    };
  }

  // Optimalt
  if (lux <= config.optimalMaxLux) {
    return {
      lux, status: "optimal", method, checkedAt: now, note: null,
      passed: true,
      warningCode: null,
      message: `Lysforhold: ${lux.toFixed(0)} lux — Optimal`,
      instruction: null,
      reliabilityModifier: config.reliabilityModifiers.optimal,
    };
  }

  // Højt men brugbart
  if (lux <= config.tooHighLux) {
    return {
      lux, status: "caution", method, checkedAt: now, note: null,
      passed: true,
      warningCode: "HIGH_LIGHT",
      message: `Lysforhold: ${lux.toFixed(0)} lux — Højt`,
      instruction: "Dæmp belysningen for bedre testkvalitet.",
      reliabilityModifier: config.reliabilityModifiers.caution,
    };
  }

  // For lyst
  return {
    lux, status: "poor", method, checkedAt: now, note: null,
    passed: false,
    warningCode: "TOO_BRIGHT",
    message: `Lysforhold: ${lux.toFixed(0)} lux — For lyst`,
    instruction: "Dæmp belysningen væsentligt. Undgå direkte sol og stærke lamper.",
    reliabilityModifier: config.reliabilityModifiers.poor,
  };
}

/**
 * Manuel bekræftelse — optiker godkender visuelt.
 */
export function manualLightConfirmation(
  confirmed: boolean,
  note?: string
): AmbientLightResult {
  return {
    lux: null,
    status: confirmed ? "caution" : "poor",
    method: "manual",
    checkedAt: new Date().toISOString(),
    note: note || (confirmed ? "Manuelt bekræftet: dæmpet og stabil belysning" : "Manuelt afvist: lysforhold utilstrækkelige"),
    passed: confirmed,
    warningCode: confirmed ? null : "SENSOR_UNAVAILABLE",
    message: confirmed ? "Lysforhold: Manuelt godkendt" : "Lysforhold: Ikke godkendt",
    instruction: confirmed ? null : "Justér lysforhold og prøv igen.",
    reliabilityModifier: confirmed
      ? DEFAULT_AMBIENT_LIGHT_CONFIG.reliabilityModifiers.caution
      : DEFAULT_AMBIENT_LIGHT_CONFIG.reliabilityModifiers.poor,
  };
}
