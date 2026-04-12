/**
 * GDPR Article 30 — Audit Logging Middleware
 *
 * Logger alle API-kald med bruger-ID, handling, IP og user-agent.
 * SIKKERHED: Logger ALDRIG request body (kan indeholde patientdata).
 */
import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";

export async function auditLog(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Kun log authenticated requests med muterende metoder
  if (!req.user || req.method === "GET") {
    next();
    return;
  }

  const action = `${req.method} ${req.path}`;
  const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
  const userAgent = req.headers["user-agent"] || "unknown";

  try {
    const resourceId = extractResourceId(req.path);
    const resourceType = extractResourceType(req.path);
    await prisma.auditLog.create({
      data: {
        user_id: req.user.userId,
        action,
        resource: resourceId ? `${resourceType}:${resourceId}` : resourceType,
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    });
  } catch (err) {
    // Audit log-fejl må ALDRIG blokere request
    logger.error("Audit", "Kunne ikke logge audit event");
  }

  next();
}

function extractResourceType(path: string): string {
  const parts = path.split("/").filter(Boolean);
  // /api/patients/123 → "patients"
  return parts[1] || "unknown";
}

function extractResourceId(path: string): string | null {
  const parts = path.split("/").filter(Boolean);
  // /api/patients/123 → "123"
  return parts[2] || null;
}
