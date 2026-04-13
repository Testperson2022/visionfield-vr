/**
 * Screening Analysis API Endpoint
 *
 * POST /api/screening/analyze — Kør screening-analyse server-side
 * GET /api/screening/:sessionId — Hent cached screening-resultat
 *
 * VIGTIGT: Screening — ikke diagnostisk software.
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);

/** POST /api/screening/analyze — Kør analyse på en session */
router.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) throw new AppError(400, "MISSING_SESSION_ID", "sessionId påkrævet");

    const session = await prisma.testSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) throw new AppError(404, "SESSION_NOT_FOUND", "Session ikke fundet");
    if (!session.results_json) throw new AppError(400, "NO_RESULTS", "Ingen resultater");

    const results = session.results_json as any;

    // Kør screening-analyse (server-side version)
    // I produktion: importér shared/screening/engine
    // For nu: returnér de rå data med metadata
    const analysis = {
      sessionId,
      eye: session.eye,
      reliability: {
        falsePositiveRate: session.false_positive_rate,
        falseNegativeRate: session.false_negative_rate,
        fixationLossRate: session.fixation_loss_rate,
        isReliable: session.is_reliable,
      },
      globalIndices: {
        meanDeviationDb: results.mean_deviation_db,
        patternSdDb: results.pattern_sd_db,
        ght: results.ght,
      },
      triageClassification: results.triage_classification,
      triageRecommendation: results.triage_recommendation,
      pointCount: results.point_results?.length ?? 0,
      disclaimer: "SCREENING — ikke diagnostisk software. Skal vurderes af kvalificeret fagperson.",
      algorithmVersion: "1.0.0-screening",
      analyzedAt: new Date().toISOString(),
    };

    logger.clinical("SCREENING_ANALYSIS", sessionId);

    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
});

export default router;
