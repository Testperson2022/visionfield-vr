/**
 * Rate Limiting — Beskytter mod brute-force angreb.
 *
 * /auth/login: Max 5 forsøg per 15 min per IP
 * /api/*: Max 100 requests per minut per IP
 *
 * SIKKERHED: Forhindrer credential stuffing og DoS.
 */
import rateLimit from "express-rate-limit";

/** Streng rate limit for login — 5 forsøg per 15 minutter */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "For mange login-forsøg. Prøv igen om 15 minutter.",
    },
  },
});

/** Generel API rate limit — 100 requests per minut */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "For mange forespørgsler. Prøv igen om lidt.",
    },
  },
});
