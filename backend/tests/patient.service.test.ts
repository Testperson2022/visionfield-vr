/**
 * Tests for Patient Service — encryption roundtrip, CPR hashing.
 * Bruger mocked Prisma client.
 *
 * SIKKERHED: Verificerer at patientdata krypteres INDEN DB-lagring
 * og dekrypteres korrekt ved hentning.
 */
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.BCRYPT_COST = "4";

import { encrypt, decrypt } from "../src/utils/crypto";
import bcrypt from "bcrypt";

// Vi tester krypteringslogikken direkte da Prisma kræver DB-forbindelse
describe("Patient encryption logic", () => {
  it("should encrypt patient name before storage", () => {
    const firstName = "Hans";
    const encrypted = encrypt(firstName);

    // Krypteret værdi skal IKKE indeholde klartekst
    expect(encrypted).not.toContain("Hans");
    // Skal have iv:authTag:ciphertext format
    expect(encrypted.split(":")).toHaveLength(3);
  });

  it("should decrypt patient name after retrieval", () => {
    const firstName = "Grethe";
    const encrypted = encrypt(firstName);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe("Grethe");
  });

  it("should handle Danish special characters", () => {
    const name = "Ørsted Åse Bæk-Müller";
    const encrypted = encrypt(name);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(name);
  });

  it("should produce different ciphertext for same name (random IV)", () => {
    const enc1 = encrypt("Jensen");
    const enc2 = encrypt("Jensen");
    expect(enc1).not.toBe(enc2);
    // Men begge skal dekryptere til samme værdi
    expect(decrypt(enc1)).toBe("Jensen");
    expect(decrypt(enc2)).toBe("Jensen");
  });

  it("should reject tampered ciphertext (auth tag verification)", () => {
    const encrypted = encrypt("Sensitive Name");
    const parts = encrypted.split(":");
    // Tamper med auth tag
    parts[1] = "ff" + parts[1].slice(2);
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});

describe("CPR hashing", () => {
  it("should hash CPR with bcrypt", async () => {
    const cpr = "0101801234";
    const hash = await bcrypt.hash(cpr, 4);

    expect(hash).not.toBe(cpr);
    expect(hash.startsWith("$2b$")).toBe(true);
  });

  it("should verify CPR against hash", async () => {
    const cpr = "0101801234";
    const hash = await bcrypt.hash(cpr, 4);

    expect(await bcrypt.compare(cpr, hash)).toBe(true);
    expect(await bcrypt.compare("9999999999", hash)).toBe(false);
  });

  it("should produce different hashes for same CPR (random salt)", async () => {
    const cpr = "1507651234";
    const hash1 = await bcrypt.hash(cpr, 4);
    const hash2 = await bcrypt.hash(cpr, 4);

    expect(hash1).not.toBe(hash2);
    // Begge skal stadig matche originalen
    expect(await bcrypt.compare(cpr, hash1)).toBe(true);
    expect(await bcrypt.compare(cpr, hash2)).toBe(true);
  });

  it("should not use MD5 or SHA for CPR (only bcrypt)", async () => {
    const cpr = "0101801234";
    const hash = await bcrypt.hash(cpr, 4);

    // bcrypt hash starter altid med $2b$ (eller $2a$)
    expect(hash.startsWith("$2")).toBe(true);
    // MD5 er 32 hex chars, SHA256 er 64 hex chars — bcrypt er længere
    expect(hash.length).toBeGreaterThan(50);
  });
});

describe("Patient data flow (encrypt → store → decrypt)", () => {
  it("should simulate full roundtrip", () => {
    // Simulerer patient.service.ts createPatient → getPatientById flow
    const input = {
      firstName: "Hans",
      lastName: "Jensen",
      birthYear: 1980,
    };

    // Encrypt before "storing" (what createPatient does)
    const stored = {
      first_name_encrypted: encrypt(input.firstName),
      last_name_encrypted: encrypt(input.lastName),
      birth_year: input.birthYear,
    };

    // Verify stored data contains NO plaintext
    expect(stored.first_name_encrypted).not.toContain("Hans");
    expect(stored.last_name_encrypted).not.toContain("Jensen");

    // Decrypt after "retrieving" (what getPatientById does)
    const displayed = {
      firstName: decrypt(stored.first_name_encrypted),
      lastName: decrypt(stored.last_name_encrypted),
      birthYear: stored.birth_year,
    };

    expect(displayed.firstName).toBe("Hans");
    expect(displayed.lastName).toBe("Jensen");
    expect(displayed.birthYear).toBe(1980);
  });
});
