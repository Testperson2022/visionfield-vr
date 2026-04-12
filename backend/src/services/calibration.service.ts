/**
 * Calibration Service — Headset luminans-kalibrering.
 *
 * Kalibreringssessioner udløber efter 30 dage.
 * Ref: shared/types/index.ts — CalibrationSession.valid_until
 */
import { prisma } from "../db/prisma";
import { AppError, CalibrationError } from "../middleware/errorHandler";

export interface CreateCalibrationInput {
  deviceId: string;
  backgroundLuminanceCdm2: number;
  maxStimulusLuminanceCdm2: number;
  gammaCorrectionTable: number[];
  warmupDurationSeconds: number;
}

export async function createCalibration(input: CreateCalibrationInput) {
  if (input.gammaCorrectionTable.length !== 256) {
    throw new CalibrationError("Gamma-tabel skal have præcis 256 værdier");
  }

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30); // 30 dages gyldighed

  return prisma.calibrationSession.create({
    data: {
      device_id: input.deviceId,
      background_luminance_cdm2: input.backgroundLuminanceCdm2,
      max_stimulus_luminance_cdm2: input.maxStimulusLuminanceCdm2,
      gamma_correction_table: input.gammaCorrectionTable,
      warmup_duration_seconds: input.warmupDurationSeconds,
      is_valid: true,
      valid_until: validUntil,
    },
  });
}

export async function getLatestCalibration(deviceId: string) {
  const calibration = await prisma.calibrationSession.findFirst({
    where: {
      device_id: deviceId,
      is_valid: true,
      valid_until: { gt: new Date() },
    },
    orderBy: { calibrated_at: "desc" },
  });

  if (!calibration) {
    throw new CalibrationError(`Ingen gyldig kalibrering for device ${deviceId}`);
  }

  return calibration;
}

export async function validateCalibration(calibrationId: string): Promise<boolean> {
  const cal = await prisma.calibrationSession.findUnique({
    where: { id: calibrationId },
  });

  if (!cal) return false;
  return cal.is_valid && cal.valid_until > new Date();
}
