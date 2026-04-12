/**
 * Tests for Auth Service — login, JWT, password hashing.
 */
process.env.JWT_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.JWT_EXPIRES_IN = "1h";
process.env.BCRYPT_COST = "4"; // Lav cost for hurtige tests

import { hashPassword, verifyToken } from "../src/services/auth.service";
import jwt from "jsonwebtoken";

describe("hashPassword", () => {
  it("should hash a password", async () => {
    const hash = await hashPassword("Password123!");
    expect(hash).toBeDefined();
    expect(hash).not.toBe("Password123!");
    expect(hash.startsWith("$2b$")).toBe(true); // bcrypt prefix
  });

  it("should produce different hashes for same input (random salt)", async () => {
    const hash1 = await hashPassword("test");
    const hash2 = await hashPassword("test");
    expect(hash1).not.toBe(hash2);
  });
});

describe("verifyToken", () => {
  it("should verify a valid JWT", () => {
    const payload = { userId: "123", clinicId: "456", role: "ADMIN", email: "a@b.dk" };
    const token = jwt.sign(payload, process.env.JWT_SECRET!);
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe("123");
    expect(decoded.clinicId).toBe("456");
    expect(decoded.role).toBe("ADMIN");
    expect(decoded.email).toBe("a@b.dk");
  });

  it("should throw on invalid token", () => {
    expect(() => verifyToken("invalid.token.here")).toThrow();
  });

  it("should throw on expired token", () => {
    const token = jwt.sign(
      { userId: "123", clinicId: "456", role: "ADMIN", email: "a@b.dk" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );
    // Token udløber øjeblikkeligt
    expect(() => verifyToken(token)).toThrow();
  });

  it("should throw on wrong secret", () => {
    const token = jwt.sign({ userId: "123" }, "wrong-secret-key-that-is-long-enough-for-jwt-validation");
    expect(() => verifyToken(token)).toThrow();
  });
});
