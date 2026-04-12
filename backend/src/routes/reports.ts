/**
 * Reports Route — Server-side PDF generering.
 * Ref: lessons.md — PDF genereres server-side (sikkerhed + memory).
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import * as sessionService from "../services/test-session.service";

const router = Router();
router.use(authenticate);

router.get("/:sessionId/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getSession(req.params.sessionId);

    // TODO: Implementér PDF-generering med pdfkit eller puppeteer
    // For nu returnerer vi JSON-data der kan bruges til PDF
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        status: session.status,
        results: session.results_json,
        message: "PDF-generering implementeres i næste iteration",
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
