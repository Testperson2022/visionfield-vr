/**
 * VisionField VR — Anonymiseret Logger
 *
 * SIKKERHED: Logger ALDRIG patientdata (navne, CPR).
 * Kun session-ID'er og generiske fejlkoder.
 * Ref: CLAUDE.md, lessons.md — ingen PII i logs.
 */

type LogLevel = "info" | "warn" | "error";

function formatMessage(level: LogLevel, context: string, message: string, sessionId?: string): string {
  const timestamp = new Date().toISOString();
  const sid = sessionId ? ` [session:${sessionId}]` : "";
  return `[${timestamp}] ${level.toUpperCase()} [${context}]${sid} ${message}`;
}

export const logger = {
  info(context: string, message: string, sessionId?: string) {
    console.log(formatMessage("info", context, message, sessionId));
  },

  warn(context: string, message: string, sessionId?: string) {
    console.warn(formatMessage("warn", context, message, sessionId));
  },

  error(context: string, message: string, sessionId?: string) {
    console.error(formatMessage("error", context, message, sessionId));
  },

  /** Log klinisk hændelse (audit trail) */
  clinical(action: string, sessionId: string, details?: string) {
    const msg = details
      ? `${action}: ${details}`
      : action;
    console.log(formatMessage("info", "CLINICAL", msg, sessionId));
  },
};
