import {
  createRateLimiter,
  REGISTRATION_WINDOW_MS,
} from "../lib/rateLimit.js";

const verificationRateLimitMessage = "Too many verification attempts, try again later";

export const registrationOtpRequestRateLimit = createRateLimiter({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 3,
  message: verificationRateLimitMessage,
  includeRetryAfter: true,
});

export const registrationOtpVerifyRateLimit = createRateLimiter({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 10,
  message: verificationRateLimitMessage,
  includeRetryAfter: true,
});
