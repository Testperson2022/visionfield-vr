/**
 * Auth Service — Login, JWT-generering, password-hashing.
 */
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { JwtPayload, getJwtSecret } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || "12", 10);
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

export async function login(email: string, password: string): Promise<{ token: string; user: JwtPayload }> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.is_active) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Ugyldige loginoplysninger");
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new AppError(401, "AUTH_INVALID_CREDENTIALS", "Ugyldige loginoplysninger");
  }

  const payload: JwtPayload = {
    userId: user.id,
    clinicId: user.clinic_id,
    role: user.role as JwtPayload["role"],
    email: user.email,
  };

  const token = jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] });

  logger.info("Auth", `Login: ${user.role}`, user.id);
  return { token, user: payload };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getJwtSecret()) as JwtPayload;
}
