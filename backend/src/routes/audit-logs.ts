/**
 * Audit Log Routes — GDPR Article 30 compliance.
 * Kun tilgængelig for ADMIN-brugere.
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { prisma } from "../db/prisma";

const router = Router();
router.use(authenticate);
router.use(requireRole("ADMIN"));

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        orderBy: { created_at: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: { select: { email: true, role: true, first_name: true, last_name: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: { items: logs, total, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
