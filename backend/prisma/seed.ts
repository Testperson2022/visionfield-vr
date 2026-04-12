/**
 * VisionField VR — Database Seed
 *
 * Opretter testdata til development:
 * - 1 klinik
 * - 3 brugere (admin, kliniker, operatør)
 * - 2 patienter (krypterede navne)
 * - 1 device med kalibrering
 *
 * Kør: npx tsx prisma/seed.ts
 * SIKKERHED: Bruger KUN i development — aldrig i produktion.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();
const BCRYPT_COST = 12;

// Simpel AES-256-GCM kryptering (spejler src/utils/crypto.ts)
function encrypt(plaintext: string): string {
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY ||
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    "hex"
  );
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

async function main() {
  console.log("Seeding database...");

  // Klinik
  const clinic = await prisma.clinic.create({
    data: {
      name: "Øjenklinikken Aarhus",
      address: "Banegårdspladsen 1, 8000 Aarhus C",
      cvr: "12345678",
    },
  });
  console.log(`  Klinik: ${clinic.name} (${clinic.id})`);

  // Brugere
  const passwordHash = await bcrypt.hash("Password123!", BCRYPT_COST);

  const admin = await prisma.user.create({
    data: {
      clinic_id: clinic.id,
      email: "admin@visionfield.dk",
      password_hash: passwordHash,
      first_name: "Anna",
      last_name: "Administratrix",
      role: "ADMIN",
    },
  });

  const clinician = await prisma.user.create({
    data: {
      clinic_id: clinic.id,
      email: "kliniker@visionfield.dk",
      password_hash: passwordHash,
      first_name: "Karen",
      last_name: "Kliniker",
      role: "CLINICIAN",
    },
  });

  const operator = await prisma.user.create({
    data: {
      clinic_id: clinic.id,
      email: "operator@visionfield.dk",
      password_hash: passwordHash,
      first_name: "Ole",
      last_name: "Operatør",
      role: "OPERATOR",
    },
  });
  console.log(`  Brugere: admin, kliniker, operatør (password: Password123!)`);

  // Patienter (krypterede navne, hashede CPR)
  const patient1 = await prisma.patient.create({
    data: {
      clinic_id: clinic.id,
      cpr_hash: await bcrypt.hash("0101801234", BCRYPT_COST),
      first_name_encrypted: encrypt("Hans"),
      last_name_encrypted: encrypt("Jensen"),
      birth_year: 1980,
      gender: "M",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      clinic_id: clinic.id,
      cpr_hash: await bcrypt.hash("1507651234", BCRYPT_COST),
      first_name_encrypted: encrypt("Grethe"),
      last_name_encrypted: encrypt("Sørensen"),
      birth_year: 1965,
      gender: "F",
    },
  });
  console.log(`  Patienter: Hans Jensen, Grethe Sørensen`);

  // Device
  const device = await prisma.device.create({
    data: {
      clinic_id: clinic.id,
      headset_model: "Meta Quest 3",
      headset_serial: "MQ3-DEV-001",
      firmware_version: "62.0.0",
    },
  });
  console.log(`  Device: ${device.headset_model} (${device.headset_serial})`);

  // Kalibrering (gyldig 30 dage)
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const gammaTable = Array.from({ length: 256 }, (_, i) => i / 255);

  await prisma.calibrationSession.create({
    data: {
      device_id: device.id,
      background_luminance_cdm2: 10.0,
      max_stimulus_luminance_cdm2: 3183.0,
      gamma_correction_table: gammaTable,
      warmup_duration_seconds: 30,
      is_valid: true,
      valid_until: validUntil,
    },
  });
  console.log(`  Kalibrering: gyldig til ${validUntil.toLocaleDateString("da-DK")}`);

  console.log("\nSeed færdig!");
  console.log("Login: admin@visionfield.dk / Password123!");
}

main()
  .catch((e) => {
    console.error("Seed fejlede:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
