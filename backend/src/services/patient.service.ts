/**
 * Patient Service — CRUD med AES-256-GCM kryptering og CPR-hashing.
 *
 * KLINISK KRITISK:
 * - Navne krypteres INDEN de skrives til DB
 * - CPR hashes med bcrypt (cost 12) for søgning
 * - Dekrypterede navne sendes KUN til autentificerede klinikere
 * - ALDRIG patientdata i logs
 */
import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { encrypt, decrypt } from "../utils/crypto";
import { AppError } from "../middleware/errorHandler";

const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || "12", 10);

export interface CreatePatientInput {
  cpr: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  clinicId: string;
}

export interface PatientDisplay {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number;
  createdAt: Date;
}

export async function createPatient(input: CreatePatientInput): Promise<PatientDisplay> {
  // Hash CPR for søgning (bcrypt cost 12)
  const cprHash = await bcrypt.hash(input.cpr, BCRYPT_COST);

  // Kryptér navne med AES-256-GCM
  const firstNameEncrypted = encrypt(input.firstName);
  const lastNameEncrypted = encrypt(input.lastName);

  const patient = await prisma.patient.create({
    data: {
      clinic_id: input.clinicId,
      cpr_hash: cprHash,
      first_name_encrypted: firstNameEncrypted,
      last_name_encrypted: lastNameEncrypted,
      birth_year: input.birthYear,
    },
  });

  return {
    id: patient.id,
    firstName: input.firstName,
    lastName: input.lastName,
    birthYear: patient.birth_year,
    createdAt: patient.created_at,
  };
}

export async function getPatientById(id: string, clinicId: string): Promise<PatientDisplay> {
  const patient = await prisma.patient.findFirst({
    where: { id, clinic_id: clinicId },
  });

  if (!patient) {
    throw new AppError(404, "PATIENT_NOT_FOUND", "Patient ikke fundet");
  }

  return {
    id: patient.id,
    firstName: decrypt(patient.first_name_encrypted),
    lastName: decrypt(patient.last_name_encrypted),
    birthYear: patient.birth_year,
    createdAt: patient.created_at,
  };
}

export async function listPatients(
  clinicId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({
      where: { clinic_id: clinicId },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where: { clinic_id: clinicId } }),
  ]);

  const items: PatientDisplay[] = patients.map((p) => ({
    id: p.id,
    firstName: decrypt(p.first_name_encrypted),
    lastName: decrypt(p.last_name_encrypted),
    birthYear: p.birth_year,
    createdAt: p.created_at,
  }));

  return { items, total, page, pageSize };
}

/**
 * Søg patient via CPR-nummer.
 * Henter ALLE patienter i klinikken og matcher bcrypt-hash.
 * (Bcrypt er en one-way hash — kan ikke søge direkte i DB.)
 */
export async function findPatientByCpr(
  cpr: string,
  clinicId: string
): Promise<PatientDisplay | null> {
  const patients = await prisma.patient.findMany({
    where: { clinic_id: clinicId },
    select: { id: true, cpr_hash: true, first_name_encrypted: true, last_name_encrypted: true, birth_year: true, created_at: true },
  });

  for (const p of patients) {
    const match = await bcrypt.compare(cpr, p.cpr_hash);
    if (match) {
      return {
        id: p.id,
        firstName: decrypt(p.first_name_encrypted),
        lastName: decrypt(p.last_name_encrypted),
        birthYear: p.birth_year,
        createdAt: p.created_at,
      };
    }
  }

  return null;
}
