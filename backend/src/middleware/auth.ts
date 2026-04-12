/**
 * JWT-autentificering og rolle-baseret adgangskontrol.
 * Token udløber efter 8 timer (JWT_EXPIRES_IN).
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { logger } from "../utils/logger";

export interface JwtPayload {
  userId: string;
  clinicId: string;
  role: "ADMIN" | "CLINICIAN" | "OPERATOR";
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 64) {
    throw new Error("JWT_SECRET skal være mindst 64 tegn. Se .env.example");
  }
  return secret;
}

/** Verificér JWT-token fra Authorization header. */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: { code: "AUTH_MISSING", message: "Authorization header mangler" },
    });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    logger.warn("Auth", "Ugyldig token");
    res.status(401).json({
      success: false,
      error: { code: "AUTH_INVALID", message: "Ugyldig eller udløbet token" },
    });
  }
}

/** Kræv en bestemt rolle (eller højere). */
export function requireRole(...roles: JwtPayload["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "AUTH_MISSING", message: "Ikke autentificeret" },
      });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: { code: "AUTH_FORBIDDEN", message: "Utilstrækkelig rettighed" },
      });
      return;
    }
    next();
  };
}

export { getJwtSecret };
