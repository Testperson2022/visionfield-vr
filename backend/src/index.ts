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

import authRoutes from "./routes/auth";
import patientRoutes from "./routes/patients";
import testSessionRoutes from "./routes/test-sessions";
import calibrationRoutes from "./routes/calibrations";
import deviceRoutes from "./routes/devices";
import reportRoutes from "./routes/reports";

import { setupWebSocket } from "./websocket/handler";
import { logger } from "./utils/logger";

const app = express();
const PORT = parseInt(process.env.PORT || "3001", 10);

// ─── Middleware ──────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" })); // Stor nok til gamma-tabeller
app.use(auditLog);

// ─── Health check ───────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0" });
});

// ─── API Routes ─────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/test-sessions", testSessionRoutes);
app.use("/api/calibrations", calibrationRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/reports", reportRoutes);

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
