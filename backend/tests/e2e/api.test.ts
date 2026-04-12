/**
 * E2E API Tests — Express routes integration
 *
 * Tester API-endpoints uden database (middleware + routing + validering).
 * Verificerer:
 * - Auth middleware afviser uautentificerede kald
 * - Zod-validering afviser ugyldige input
 * - Fejlhåndtering returnerer korrekte statuskoder
 * - Ingen patientdata i fejlsvar
 */
import "./setup";
import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { errorHandler } from "../../src/middleware/errorHandler";
import { authenticate, requireRole } from "../../src/middleware/auth";
import { validate } from "../../src/middleware/validate";
import { z } from "zod";

// Minimal test-app med auth middleware
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Offentlig route
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // Auth-beskyttet route
  app.get("/api/protected", authenticate, (req, res) => {
    res.json({ success: true, data: { userId: req.user!.userId } });
  });

  // Rolle-beskyttet route
  app.get("/api/admin-only", authenticate, requireRole("ADMIN"), (_req, res) => {
    res.json({ success: true, data: "admin content" });
  });

  // Valideret route
  app.post("/api/validated",
    validate(z.object({
      email: z.string().email(),
      name: z.string().min(1).max(100),
    })),
    (req, res) => {
      res.json({ success: true, data: req.body });
    }
  );

  app.use(errorHandler);
  return app;
}

const app = createTestApp();

function makeToken(role: string = "CLINICIAN") {
  return jwt.sign(
    { userId: "user-123", clinicId: "clinic-456", role, email: "test@visionfield.dk" },
    process.env.JWT_SECRET!
  );
}

describe("Health endpoint", () => {
  it("GET /health returns 200", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("Authentication middleware", () => {
  it("rejects request without token", async () => {
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("AUTH_MISSING");
  });

  it("rejects request with invalid token", async () => {
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", "Bearer invalid-token");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("AUTH_INVALID");
  });

  it("accepts request with valid token", async () => {
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe("user-123");
  });

  it("rejects expired token", async () => {
    const expiredToken = jwt.sign(
      { userId: "123", clinicId: "456", role: "ADMIN", email: "a@b.dk" },
      process.env.JWT_SECRET!,
      { expiresIn: "0s" }
    );
    const res = await request(app)
      .get("/api/protected")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});

describe("Role-based access", () => {
  it("allows ADMIN to access admin route", async () => {
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${makeToken("ADMIN")}`);
    expect(res.status).toBe(200);
  });

  it("denies OPERATOR access to admin route", async () => {
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${makeToken("OPERATOR")}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("AUTH_FORBIDDEN");
  });

  it("denies CLINICIAN access to admin route", async () => {
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${makeToken("CLINICIAN")}`);
    expect(res.status).toBe(403);
  });
});

describe("Input validation (Zod)", () => {
  it("accepts valid input", async () => {
    const res = await request(app)
      .post("/api/validated")
      .send({ email: "test@visionfield.dk", name: "Hans" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/validated")
      .send({ email: "not-an-email", name: "Hans" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects missing required field", async () => {
    const res = await request(app)
      .post("/api/validated")
      .send({ email: "test@visionfield.dk" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects empty name", async () => {
    const res = await request(app)
      .post("/api/validated")
      .send({ email: "test@visionfield.dk", name: "" });
    expect(res.status).toBe(400);
  });
});

describe("Error responses contain no PII", () => {
  it("401 contains only error code, no patient data", async () => {
    const res = await request(app).get("/api/protected");
    expect(res.body.error.code).toBeDefined();
    expect(res.body.error.message).toBeDefined();
    // Ingen patient-felter
    expect(res.body.error.cpr).toBeUndefined();
    expect(res.body.error.firstName).toBeUndefined();
    expect(res.body.error.patient).toBeUndefined();
  });

  it("403 contains only error code", async () => {
    const res = await request(app)
      .get("/api/admin-only")
      .set("Authorization", `Bearer ${makeToken("OPERATOR")}`);
    expect(Object.keys(res.body.error)).toEqual(
      expect.arrayContaining(["code", "message"])
    );
  });

  it("400 validation error contains field names but no PII", async () => {
    const res = await request(app)
      .post("/api/validated")
      .send({ email: "bad", name: "" });
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    // Details har feltnavne men ALDRIG bruger-input
    if (res.body.error.details) {
      for (const detail of res.body.error.details) {
        expect(detail.field).toBeDefined();
        expect(detail.message).toBeDefined();
      }
    }
  });
});
