/**
 * VisionField VR — 24-2 Testgrid
 *
 * Humphrey-kompatibelt 24-2 gitter.
 * Koordinater: x positiv = temporal, y positiv = superior.
 * Kilde: Heijl et al. 1987 normative database.
 *
 * KLINISK KRITISK: Disse koordinater må IKKE ændres.
 * Ændringer kræver ny klinisk validering.
 */

import { GridPoint } from "./index";

export const GRID_24_2: GridPoint[] = [
  // Øverste halvdel (superior)
  { id: 0,  x_deg: -27, y_deg: 3,  is_blind_spot: false, normative_threshold_db: 24.0, normative_sd_db: 3.2 },
  { id: 1,  x_deg: -21, y_deg: 3,  is_blind_spot: false, normative_threshold_db: 26.5, normative_sd_db: 2.8 },
  { id: 2,  x_deg: -15, y_deg: 3,  is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },
  { id: 3,  x_deg: -9,  y_deg: 3,  is_blind_spot: false, normative_threshold_db: 29.5, normative_sd_db: 2.2 },
  { id: 4,  x_deg: -3,  y_deg: 3,  is_blind_spot: false, normative_threshold_db: 30.5, normative_sd_db: 2.0 },
  { id: 5,  x_deg: 3,   y_deg: 3,  is_blind_spot: false, normative_threshold_db: 30.5, normative_sd_db: 2.0 },
  { id: 6,  x_deg: 9,   y_deg: 3,  is_blind_spot: false, normative_threshold_db: 29.5, normative_sd_db: 2.2 },
  { id: 7,  x_deg: 15,  y_deg: 3,  is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },
  { id: 8,  x_deg: 21,  y_deg: 3,  is_blind_spot: false, normative_threshold_db: 26.0, normative_sd_db: 2.8 },
  { id: 9,  x_deg: 27,  y_deg: 3,  is_blind_spot: false, normative_threshold_db: 24.0, normative_sd_db: 3.2 },

  { id: 10, x_deg: -27, y_deg: 9,  is_blind_spot: false, normative_threshold_db: 24.5, normative_sd_db: 3.0 },
  { id: 11, x_deg: -21, y_deg: 9,  is_blind_spot: false, normative_threshold_db: 27.0, normative_sd_db: 2.7 },
  { id: 12, x_deg: -15, y_deg: 9,  is_blind_spot: false, normative_threshold_db: 28.5, normative_sd_db: 2.4 },
  { id: 13, x_deg: -9,  y_deg: 9,  is_blind_spot: false, normative_threshold_db: 30.0, normative_sd_db: 2.1 },
  { id: 14, x_deg: -3,  y_deg: 9,  is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 15, x_deg: 3,   y_deg: 9,  is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 16, x_deg: 9,   y_deg: 9,  is_blind_spot: true,  normative_threshold_db: 0.0,  normative_sd_db: 0.0 }, // Blind spot (OD)
  { id: 17, x_deg: 15,  y_deg: 9,  is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },
  { id: 18, x_deg: 21,  y_deg: 9,  is_blind_spot: false, normative_threshold_db: 26.5, normative_sd_db: 2.7 },
  { id: 19, x_deg: 27,  y_deg: 9,  is_blind_spot: false, normative_threshold_db: 24.0, normative_sd_db: 3.0 },

  { id: 20, x_deg: -21, y_deg: 15, is_blind_spot: false, normative_threshold_db: 27.5, normative_sd_db: 2.6 },
  { id: 21, x_deg: -15, y_deg: 15, is_blind_spot: false, normative_threshold_db: 29.0, normative_sd_db: 2.3 },
  { id: 22, x_deg: -9,  y_deg: 15, is_blind_spot: false, normative_threshold_db: 30.5, normative_sd_db: 2.0 },
  { id: 23, x_deg: -3,  y_deg: 15, is_blind_spot: false, normative_threshold_db: 31.5, normative_sd_db: 1.8 },
  { id: 24, x_deg: 3,   y_deg: 15, is_blind_spot: false, normative_threshold_db: 31.5, normative_sd_db: 1.8 },
  { id: 25, x_deg: 9,   y_deg: 15, is_blind_spot: false, normative_threshold_db: 30.0, normative_sd_db: 2.1 },
  { id: 26, x_deg: 15,  y_deg: 15, is_blind_spot: false, normative_threshold_db: 28.5, normative_sd_db: 2.4 },
  { id: 27, x_deg: 21,  y_deg: 15, is_blind_spot: false, normative_threshold_db: 27.0, normative_sd_db: 2.6 },

  { id: 28, x_deg: -21, y_deg: 21, is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },
  { id: 29, x_deg: -15, y_deg: 21, is_blind_spot: false, normative_threshold_db: 29.5, normative_sd_db: 2.2 },
  { id: 30, x_deg: -9,  y_deg: 21, is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 31, x_deg: -3,  y_deg: 21, is_blind_spot: false, normative_threshold_db: 32.0, normative_sd_db: 1.7 },

  // Nedre halvdel (inferior) — spejlet
  { id: 32, x_deg: 3,   y_deg: -21, is_blind_spot: false, normative_threshold_db: 32.0, normative_sd_db: 1.7 },
  { id: 33, x_deg: 9,   y_deg: -21, is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 34, x_deg: 15,  y_deg: -21, is_blind_spot: false, normative_threshold_db: 29.5, normative_sd_db: 2.2 },
  { id: 35, x_deg: 21,  y_deg: -21, is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },

  { id: 36, x_deg: -21, y_deg: -15, is_blind_spot: false, normative_threshold_db: 27.5, normative_sd_db: 2.6 },
  { id: 37, x_deg: -15, y_deg: -15, is_blind_spot: false, normative_threshold_db: 29.0, normative_sd_db: 2.3 },
  { id: 38, x_deg: -9,  y_deg: -15, is_blind_spot: false, normative_threshold_db: 30.5, normative_sd_db: 2.0 },
  { id: 39, x_deg: -3,  y_deg: -15, is_blind_spot: false, normative_threshold_db: 31.5, normative_sd_db: 1.8 },
  { id: 40, x_deg: 3,   y_deg: -15, is_blind_spot: false, normative_threshold_db: 31.5, normative_sd_db: 1.8 },
  { id: 41, x_deg: 9,   y_deg: -15, is_blind_spot: false, normative_threshold_db: 30.0, normative_sd_db: 2.1 },
  { id: 42, x_deg: 15,  y_deg: -15, is_blind_spot: false, normative_threshold_db: 28.5, normative_sd_db: 2.4 },
  { id: 43, x_deg: 21,  y_deg: -15, is_blind_spot: false, normative_threshold_db: 27.0, normative_sd_db: 2.6 },

  { id: 44, x_deg: -27, y_deg: -9,  is_blind_spot: false, normative_threshold_db: 24.5, normative_sd_db: 3.0 },
  { id: 45, x_deg: -21, y_deg: -9,  is_blind_spot: false, normative_threshold_db: 27.0, normative_sd_db: 2.7 },
  { id: 46, x_deg: -15, y_deg: -9,  is_blind_spot: false, normative_threshold_db: 28.5, normative_sd_db: 2.4 },
  { id: 47, x_deg: -9,  y_deg: -9,  is_blind_spot: false, normative_threshold_db: 30.0, normative_sd_db: 2.1 },
  { id: 48, x_deg: -3,  y_deg: -9,  is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 49, x_deg: 3,   y_deg: -9,  is_blind_spot: false, normative_threshold_db: 31.0, normative_sd_db: 1.9 },
  { id: 50, x_deg: 9,   y_deg: -9,  is_blind_spot: true,  normative_threshold_db: 0.0,  normative_sd_db: 0.0 }, // Blind spot (OS)
  { id: 51, x_deg: 15,  y_deg: -9,  is_blind_spot: false, normative_threshold_db: 28.0, normative_sd_db: 2.5 },
  { id: 52, x_deg: 21,  y_deg: -9,  is_blind_spot: false, normative_threshold_db: 26.5, normative_sd_db: 2.7 },
  { id: 53, x_deg: 27,  y_deg: -9,  is_blind_spot: false, normative_threshold_db: 24.0, normative_sd_db: 3.0 },
];

// Blind spot punkter afhænger af øje (OD: punkt 16, OS: punkt 50)
export function getBlindSpotPointId(eye: "OD" | "OS"): number {
  return eye === "OD" ? 16 : 50;
}

export function getNonBlindSpotPoints(): GridPoint[] {
  return GRID_24_2.filter((p) => !p.is_blind_spot);
}
