/**
 * Data Export Routes — CSV og DICOM eksport
 * Ref: Specvis — session export til CSV for videre analyse
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

const router = Router();
router.use(authenticate);

/** GET /api/export/:sessionId/csv — Eksportér stimulus-data som CSV */
router.get("/:sessionId/csv", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.testSession.findUnique({
      where: { id: req.params.sessionId },
      include: { stimuli: { orderBy: { presented_at_ms: "asc" } } },
    });

    if (!session) throw new AppError(404, "SESSION_NOT_FOUND", "Session ikke fundet");

    // CSV header
    const header = "grid_point_id,x_deg,y_deg,intensity_db,presented_at_ms,duration_ms,responded,response_time_ms,fixation_ok,fixation_dev_deg,is_catch_trial,catch_trial_type\n";

    const rows = session.stimuli.map((s: any) =>
      `${s.grid_point_id},${s.x_deg},${s.y_deg},${s.intensity_db},${s.presented_at_ms},200,${s.responded},${s.response_time_ms ?? ""},${s.fixation_ok},${s.fixation_dev_deg ?? ""},${s.is_catch_trial},${s.catch_trial_type ?? ""}`
    ).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="visionfield-${req.params.sessionId}.csv"`);
    res.send(header + rows);
  } catch (err) {
    next(err);
  }
});

/** GET /api/export/:sessionId/json — Eksportér fuld session som JSON */
router.get("/:sessionId/json", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.testSession.findUnique({
      where: { id: req.params.sessionId },
      include: { stimuli: { orderBy: { presented_at_ms: "asc" } } },
    });

    if (!session) throw new AppError(404, "SESSION_NOT_FOUND", "Session ikke fundet");

    res.setHeader("Content-Disposition", `attachment; filename="visionfield-${req.params.sessionId}.json"`);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

export default router;
