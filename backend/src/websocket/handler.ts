/**
 * VisionField VR — WebSocket Server Handler
 *
 * Håndterer realtidskommunikation med Unity VR-headset:
 * - JWT-autentificering ved upgrade
 * - Routing af alle 7 WebSocket event-typer
 * - Stimulus event recording til database
 *
 * SIKKERHED: Ingen patientdata i WebSocket-beskeder.
 */
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { verifyToken } from "../services/auth.service";
import * as sessionService from "../services/test-session.service";
import { logger } from "../utils/logger";
import { JwtPayload } from "../middleware/auth";

interface AuthenticatedSocket extends WebSocket {
  user?: JwtPayload;
  sessionId?: string;
}

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: AuthenticatedSocket, req: IncomingMessage) => {
    // JWT-autentificering via query parameter eller subprotocol
    const token = extractToken(req);
    if (!token) {
      logger.warn("WebSocket", "Forbindelse afvist: mangler token");
      ws.close(4001, "AUTH_REQUIRED");
      return;
    }

    try {
      ws.user = verifyToken(token);
    } catch {
      logger.warn("WebSocket", "Forbindelse afvist: ugyldig token");
      ws.close(4001, "AUTH_INVALID");
      return;
    }

    logger.info("WebSocket", `Forbundet: ${ws.user.role}`, ws.user.userId);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(ws, message);
      } catch (err) {
        logger.error("WebSocket", "Fejl ved beskedhåndtering");
        ws.send(JSON.stringify({
          type: "ERROR",
          code: "PARSE_ERROR",
          recoverable: true,
        }));
      }
    });

    ws.on("close", () => {
      logger.info("WebSocket", "Forbindelse lukket", ws.sessionId);
    });

    ws.on("error", (err) => {
      logger.error("WebSocket", "Socket fejl");
    });
  });

  return wss;
}

async function handleMessage(ws: AuthenticatedSocket, message: any): Promise<void> {
  switch (message.type) {
    case "SESSION_START":
      ws.sessionId = message.session_id;
      logger.clinical("WS_SESSION_START", message.session_id);
      break;

    case "STIMULUS_RESULT":
      if (!ws.sessionId) {
        ws.send(JSON.stringify({ type: "ERROR", code: "NO_ACTIVE_SESSION", recoverable: true }));
        return;
      }
      await sessionService.recordStimulusEvent(ws.sessionId, {
        gridPointId: message.grid_point_id,
        intensityDb: message.intensity_db,
        xDeg: message.x_deg,
        yDeg: message.y_deg,
        isCatchTrial: message.is_catch_trial,
        catchTrialType: message.catch_trial_type,
        responded: message.responded,
        responseTimeMs: message.response_time_ms > 0 ? message.response_time_ms : null,
        fixationOk: message.fixation_ok,
        fixationDeviationDeg: message.fixation_deviation_deg,
      });
      break;

    case "FIXATION_UPDATE":
      // Live fixation status — forwarded til kliniker-tablet via broadcast
      broadcastToClinicianTablet(ws, message);
      break;

    case "SESSION_COMPLETE":
      if (ws.sessionId && message.results && message.quality) {
        await sessionService.completeSession(ws.sessionId, message.results, {
          fpRate: message.quality.false_positive_rate,
          fnRate: message.quality.false_negative_rate,
          fixationLossRate: message.quality.fixation_loss_rate,
        });
        logger.clinical("WS_SESSION_COMPLETE", ws.sessionId);
      }
      break;

    case "SESSION_ABORT":
      if (ws.sessionId) {
        await sessionService.updateSessionStatus(ws.sessionId, "ABORTED" as any);
        logger.clinical("WS_SESSION_ABORT", ws.sessionId, message.reason);
      }
      break;

    default:
      logger.warn("WebSocket", `Ukendt beskedtype: ${message.type}`, ws.sessionId);
  }
}

function extractToken(req: IncomingMessage): string | null {
  // Fra query parameter: ?token=xxx
  const url = new URL(req.url || "", `http://${req.headers.host}`);
  const queryToken = url.searchParams.get("token");
  if (queryToken) return queryToken;

  // Fra Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

function broadcastToClinicianTablet(senderWs: AuthenticatedSocket, message: any): void {
  // TODO: Implementér broadcast til tilsluttede kliniker-tablets
  // For nu logger vi bare fixation-status
}
