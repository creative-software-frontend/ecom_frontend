import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

/** Registration / OTP endpoints share the same cooldown window. */
export const REGISTRATION_WINDOW_MS = 5 * 60 * 1000;

type RateLimitBody = {
  success: false;
  message: string;
  retryAfterSeconds?: number;
};

export function sendRateLimitError(
  res: Response,
  message: string,
  retryAfterSeconds?: number
) {
  const body: RateLimitBody = {
    success: false,
    message,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
  };
  return res.status(429).json(body);
}

/** Seconds left until the limiter resets, falling back to a full window. */
export function getRetryAfterSeconds(req: Request, windowMs: number): number {
  const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } })
    .rateLimit?.resetTime;

  return resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(windowMs / 1000);
}

type RateLimiterConfig = {
  windowMs: number;
  limit: number;
  message: string;
  /** Include `retryAfterSeconds` in the 429 body (needed by the countdown UI). */
  includeRetryAfter?: boolean;
  skipSuccessfulRequests?: boolean;
};

/** All auth limiters use the same headers/payload — only the knobs differ. */
export function createRateLimiter({
  windowMs,
  limit,
  message,
  includeRetryAfter = false,
  skipSuccessfulRequests,
}: RateLimiterConfig) {
  return rateLimit({
    windowMs,
    limit,
    ...(skipSuccessfulRequests === undefined ? {} : { skipSuccessfulRequests }),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) =>
      sendRateLimitError(
        res,
        message,
        includeRetryAfter ? getRetryAfterSeconds(req, windowMs) : undefined
      ),
  });
}
