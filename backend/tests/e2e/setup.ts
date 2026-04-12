/**
 * E2E Test Setup
 *
 * Konfigurerer test-miljø med environment variables.
 * Tests kører mod in-memory logik (ingen DB krævet for disse tests).
 * For fuld DB-test: brug Docker compose med test-database.
 */
process.env.JWT_SECRET = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.JWT_EXPIRES_IN = "1h";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.BCRYPT_COST = "4";
process.env.NODE_ENV = "test";
process.env.PORT = "0"; // Random port
