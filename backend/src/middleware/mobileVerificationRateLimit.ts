import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";

const rateLimitHandler = (_req: Request, res: Response) => {
  const resetTime = (_req as Request & { rateLimit?: { resetTime?: Date } })
    .rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
    : 15 * 60;
  res.status(429).json({
    success: false,
    message: "Too many verification attempts, try again later",
    retryAfterSeconds,
  });
};

export const registrationOtpRequestRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

export const registrationOtpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
