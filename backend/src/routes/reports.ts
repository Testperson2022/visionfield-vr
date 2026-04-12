/**
 * Reports Route — Server-side PDF generering.
 * Ref: lessons.md — PDF genereres server-side (sikkerhed + memory).
 */
import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db/prisma";
import { generateReportPdf, buildReportData } from "../services/report.service";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

const router = Router();
router.use(authenticate);

router.get("/:sessionId/pdf", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await prisma.testSession.findUnique({
      where: { id: req.params.sessionId },
    });

    if (!session) {
      throw new AppError(404, "SESSION_NOT_FOUND", "Session ikke fundet", req.params.sessionId);
    }

    if (!session.results_json) {
      throw new AppError(400, "NO_RESULTS", "Ingen resultater for denne session", req.params.sessionId);
    }

    const patient = await prisma.patient.findUnique({
      where: { id: session.patient_id },
    });

    if (!patient) {
      throw new AppError(404, "PATIENT_NOT_FOUND", "Patient ikke fundet");
    }

    // Byg rapport-data (dekrypterer patientnavne)
    const reportData = buildReportData(patient, session);

    // Generér PDF
    const doc = generateReportPdf(reportData);

    // Stream PDF til klient
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="visionfield-${req.params.sessionId}.pdf"`
    );

    doc.pipe(res);

    logger.clinical("PDF_GENERATED", req.params.sessionId);
  } catch (err) {
    next(err);
  }
});

export default router;
