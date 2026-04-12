/**
 * Tests for AES-256-GCM encryption/decryption.
 */

// Sæt test encryption key (32 bytes = 64 hex tegn)
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

import { encrypt, decrypt } from "../src/utils/crypto";

describe("AES-256-GCM Crypto", () => {
  it("should encrypt and decrypt a string", () => {
    const plaintext = "Hans Jensen";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should produce different ciphertext each time (random IV)", () => {
    const plaintext = "Test Patient";
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
  });

  it("should handle special characters", () => {
    const plaintext = "Ørsted Åse Bæk-Müller";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("should handle empty string", () => {
    const encrypted = encrypt("");
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe("");
  });

  it("should produce iv:authTag:ciphertext format", () => {
    const encrypted = encrypt("test");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
    expect(parts[0]).toHaveLength(32); // 16 bytes IV = 32 hex
    expect(parts[1]).toHaveLength(32); // 16 bytes auth tag = 32 hex
  });

  it("should throw on tampered ciphertext", () => {
    const encrypted = encrypt("sensitive data");
    const parts = encrypted.split(":");
    // Tamper med ciphertext
    parts[2] = "00" + parts[2].slice(2);
    expect(() => decrypt(parts.join(":"))).toThrow();
  });
});
