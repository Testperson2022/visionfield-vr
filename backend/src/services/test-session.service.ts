/**
 * Test Session Service — Session lifecycle management.
 *
 * Håndterer: create → calibrating → running → completed/aborted/invalid
 */
import { TestStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

export interface CreateSessionInput {
  patientId: string;
  deviceId: string;
  eye: "OD" | "OS";
  protocolName: string;
  calibrationId: string;
  operatorId: string;
}

export async function createSession(input: CreateSessionInput) {
  const session = await prisma.testSession.create({
    data: {
      patient_id: input.patientId,
      device_id: input.deviceId,
      eye: input.eye,
      status: "INITIALIZING",
      protocol_name: input.protocolName,
      protocol_version: "1.0.0",
      calibration_id: input.calibrationId,
      operator_id: input.operatorId,
    },
  });

  logger.clinical("SESSION_CREATED", session.id, `eye=${input.eye}`);
  return session;
}

export async function updateSessionStatus(
  sessionId: string,
  status: TestStatus
) {
  const session = await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status,
      ...(status === "COMPLETED" ? { completed_at: new Date() } : {}),
    },
  });

  logger.clinical("SESSION_STATUS", sessionId, status);
  return session;
}

export async function completeSession(
  sessionId: string,
  resultsJson: object,
  qualityMetrics: {
    fpRate: number;
    fnRate: number;
    fixationLossRate: number;
  }
) {
  const isReliable = qualityMetrics.fpRate < 0.20 && qualityMetrics.fnRate < 0.33;
  const status: TestStatus = isReliable ? "COMPLETED" : "INVALID";

  const session = await prisma.testSession.update({
    where: { id: sessionId },
    data: {
      status,
      completed_at: new Date(),
      results_json: resultsJson as any,
      false_positive_rate: qualityMetrics.fpRate,
      false_negative_rate: qualityMetrics.fnRate,
      fixation_loss_rate: qualityMetrics.fixationLossRate,
      is_reliable: isReliable,
    },
  });

  logger.clinical("SESSION_COMPLETE", sessionId, `status=${status}, reliable=${isReliable}`);
  return session;
}

export async function getSession(sessionId: string) {
  const session = await prisma.testSession.findUnique({
    where: { id: sessionId },
    include: { stimuli: { orderBy: { presented_at_ms: "asc" } } },
  });

  if (!session) {
    throw new AppError(404, "SESSION_NOT_FOUND", "Test-session ikke fundet", sessionId);
  }

  return session;
}

export async function listSessions(
  patientId: string,
  page: number = 1,
  pageSize: number = 20
) {
  const [sessions, total] = await Promise.all([
    prisma.testSession.findMany({
      where: { patient_id: patientId },
      orderBy: { started_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.testSession.count({ where: { patient_id: patientId } }),
  ]);

  return { items: sessions, total, page, pageSize };
}

export async function recordStimulusEvent(
  sessionId: string,
  event: {
    gridPointId: number;
    intensityDb: number;
    xDeg: number;
    yDeg: number;
    isCatchTrial: boolean;
    catchTrialType: string | null;
    responded: boolean;
    responseTimeMs: number | null;
    fixationOk: boolean;
    fixationDeviationDeg: number | null;
  }
) {
  return prisma.stimulusEvent.create({
    data: {
      session_id: sessionId,
      grid_point_id: event.gridPointId,
      intensity_db: event.intensityDb,
      x_deg: event.xDeg,
      y_deg: event.yDeg,
      presented_at_ms: Date.now(), // Ms since epoch
      is_catch_trial: event.isCatchTrial,
      catch_trial_type: event.catchTrialType,
      responded: event.responded,
      response_time_ms: event.responseTimeMs,
      fixation_ok: event.fixationOk,
      fixation_dev_deg: event.fixationDeviationDeg,
    },
  });
}
