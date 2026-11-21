import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const REGISTRATION_WINDOW_MS = 5 * 60 * 1000;

const rateLimitHandler = (_req: Request, res: Response) => {
  const resetTime = (_req as Request & { rateLimit?: { resetTime?: Date } })
    .rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : Math.ceil(REGISTRATION_WINDOW_MS / 1000);
  res.status(429).json({
    success: false,
    message: "Too many verification attempts, try again later",
    retryAfterSeconds,
  });
};

export const registrationOtpRequestRateLimit = rateLimit({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const registrationOtpVerifyRateLimit = rateLimit({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
