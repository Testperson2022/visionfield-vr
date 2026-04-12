/**
 * VisionField VR — Backend Entry Point
 *
 * Express REST API + WebSocket server.
 * Klasse IIa medicinsk software (MDR 2017/745).
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";

import { errorHandler } from "./middleware/errorHandler";
import { auditLog } from "./middleware/audit";
import { loginLimiter, apiLimiter } from "./middleware/rateLimiter";
import { enforceHttps } from "./middleware/httpsEnforce";

import authRoutes from "./routes/auth";
import passwordResetRoutes from "./routes/password-reset";
import patientRoutes from "./routes/patients";
import testSessionRoutes from "./routes/test-sessions";
import calibrationRoutes from "./routes/calibrations";
import deviceRoutes from "./routes/devices";
import reportRoutes from "./routes/reports";
import auditLogRoutes from "./routes/audit-logs";

import { setupWebSocket } from "./websocket/handler";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ─── Middleware ──────────────────────────────────────────────────────
app.use(enforceHttps);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true }, // 1 år HSTS
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" })); // Stor nok til gamma-tabeller
app.use(auditLog);

// ─── Rate Limiting ──────────────────────────────────────────────────
app.use("/api/", apiLimiter);

// ─── Health check ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// ─── API Routes ─────────────────────────────────────────────────────
app.use("/auth", loginLimiter, authRoutes);
app.use("/auth", loginLimiter, passwordResetRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/test-sessions", testSessionRoutes);
app.use("/api/calibrations", calibrationRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// ─── Error handler (skal være SIDST) ────────────────────────────────
app.use(errorHandler);

// ─── HTTP + WebSocket server ────────────────────────────────────────
const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  logger.info("Server", `VisionField VR Backend kører på port ${PORT}`);
  logger.info("Server", `WebSocket tilgængelig på ws://localhost:${PORT}/ws`);
});

// ─── Graceful shutdown ──────────────────────────────────────────────
process.on("SIGTERM", () => {
  logger.info("Server", "SIGTERM modtaget — lukker ned");
  server.close(() => process.exit(0));
});

export default app;
