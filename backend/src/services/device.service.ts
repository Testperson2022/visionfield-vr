/**
 * Device Service — Headset-registrering og firmware-tracking.
 */
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

export async function registerDevice(
  clinicId: string,
  model: string,
  serial: string,
  firmware: string
) {
  return prisma.device.create({
    data: {
      clinic_id: clinicId,
      headset_model: model,
      headset_serial: serial,
      firmware_version: firmware,
      is_active: true,
    },
  });
}

export async function listDevices(clinicId: string) {
  return prisma.device.findMany({
    where: { clinic_id: clinicId },
    orderBy: { registered_at: "desc" },
  });
}

export async function updateDevice(
  deviceId: string,
  data: { firmware?: string; isActive?: boolean }
) {
  return prisma.device.update({
    where: { id: deviceId },
    data: {
      ...(data.firmware ? { firmware_version: data.firmware } : {}),
      ...(data.isActive !== undefined ? { is_active: data.isActive } : {}),
    },
  });
}
