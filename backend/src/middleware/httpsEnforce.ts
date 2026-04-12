/**
 * HTTPS Enforcement Middleware
 *
 * Redirecter HTTP → HTTPS i produktion.
 * Ref: CLAUDE.md — "Al API-kommunikation er HTTPS — ingen undtagelser"
 */
import { Request, Response, NextFunction } from "express";

export function enforceHttps(req: Request, res: Response, next: NextFunction): void {
  // Kun enforcé i produktion
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }

  // Check x-forwarded-proto (bag reverse proxy / load balancer)
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  if (proto === "https") {
    next();
    return;
  }

  // Redirect til HTTPS
  res.redirect(301, `https://${req.headers.host}${req.url}`);
}
