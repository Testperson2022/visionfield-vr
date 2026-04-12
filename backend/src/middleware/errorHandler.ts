/**
 * Centraliseret fejlhåndtering.
 *
 * SIKKERHED: Returnerer ALDRIG patientdata i fejlsvar.
 * Kun generisk fejlkode + session-ID til audit trail.
 * Ref: lessons.md — patientdata må ikke inkluderes i fejlmeddelelser.
 */
import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public sessionId?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class CalibrationError extends AppError {
  constructor(message: string, sessionId?: string) {
    super(400, "CALIBRATION_ERROR", message, sessionId);
  }
}

export class ClinicalError extends AppError {
  constructor(message: string, sessionId?: string) {
    super(500, "CLINICAL_ERROR", message, sessionId);
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    // SIKKERHED: Log detaljeret fejl server-side, send kun kode til klient
    logger.error("ErrorHandler", err.message, err.sessionId);

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.code, // Generisk — aldrig detaljeret fejlbesked til klient
        session_id: err.sessionId,
      },
    });
    return;
  }

  // Uventede fejl — log alt server-side, send generisk til klient
  logger.error("ErrorHandler", `Uventet fejl: ${err.message}`);

  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "En intern fejl opstod",
    },
  });
}
