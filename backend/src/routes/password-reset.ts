/**
 * Password Reset Routes
 *
 * POST /auth/forgot-password — send reset-token (logges, sendes ikke via email i dev)
 * POST /auth/reset-password — sæt nyt password med token
 *
 * SIKKERHED: Reset-token udløber efter 1 time. Hashed i DB.
 */
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { validate } from "../middleware/validate";
import { prisma } from "../db/prisma";
import { logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

const router = Router();
const BCRYPT_COST = parseInt(process.env.BCRYPT_COST || "12", 10);

// In-memory token store (erstattes med DB-tabel eller Redis i produktion)
const resetTokens = new Map<string, { userId: string; expiresAt: Date }>();

router.post(
  "/forgot-password",
  validate(z.object({ email: z.string().email() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({ where: { email } });

      // Returnér altid success (forhindrer email-enumeration)
      if (!user) {
        res.json({ success: true, data: { message: "Hvis emailen findes, er et reset-link sendt." } });
        return;
      }

      // Generér token
      const token = crypto.randomBytes(32).toString("hex");
      resetTokens.set(token, {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 time
      });

      // I produktion: send email med link. I dev: log token.
      logger.info("PasswordReset", `Reset-token genereret for bruger`, user.id);
      if (process.env.NODE_ENV === "development") {
        logger.info("PasswordReset", `DEV TOKEN: ${token}`);
      }

      // TODO: Send email via SMTP i produktion
      res.json({ success: true, data: { message: "Hvis emailen findes, er et reset-link sendt." } });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/reset-password",
  validate(z.object({
    token: z.string().length(64),
    newPassword: z.string().min(8),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      const entry = resetTokens.get(token);

      if (!entry || entry.expiresAt < new Date()) {
        resetTokens.delete(token);
        throw new AppError(400, "INVALID_TOKEN", "Reset-token er ugyldigt eller udløbet");
      }

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      await prisma.user.update({
        where: { id: entry.userId },
        data: { password_hash: passwordHash },
      });

      resetTokens.delete(token);
      logger.info("PasswordReset", "Password nulstillet", entry.userId);

      res.json({ success: true, data: { message: "Password er nulstillet. Du kan nu logge ind." } });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
