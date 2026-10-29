import "dotenv/config";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  console.error("JWT_SECRET must be set and at least 32 characters long");
  process.exit(1);
}

export const JWT_SECRET = jwtSecret;
export const IS_PRODUCTION = process.env.NODE_ENV === "production";
export const CORS_ORIGINS = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
