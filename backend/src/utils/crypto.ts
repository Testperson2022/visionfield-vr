/**
 * VisionField VR — Kryptering
 *
 * AES-256-GCM for patientnavne (encrypt før DB, decrypt efter).
 * KLINISK KRITISK: Patientdata SKAL krypteres inden de skrives til database.
 * Ref: CLAUDE.md — AES-256-GCM, GDPR compliance.
 *
 * Format: iv:authTag:ciphertext (hex-encoded)
 */
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 128 bit
const AUTH_TAG_LENGTH = 16; // 128 bit

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY skal være 64 hex-tegn (32 bytes). Se .env.example"
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Kryptér en streng med AES-256-GCM.
 * Returnerer format: iv:authTag:ciphertext (hex)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Dekryptér en AES-256-GCM krypteret streng.
 * Input format: iv:authTag:ciphertext (hex)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Ugyldigt krypteret format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const ciphertext = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
