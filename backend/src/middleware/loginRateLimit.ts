import type { Request } from "express";
import rateLimit from "express-rate-limit";

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many attempts, try again later",
    });
  },
});

const REGISTRATION_WINDOW_MS = 5 * 60 * 1000;

export const registrationRateLimit = rateLimit({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const resetTime = (
      req as Request & { rateLimit?: { resetTime?: Date } }
    ).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.ceil(REGISTRATION_WINDOW_MS / 1000);
    res.status(429).json({
      success: false,
      message: "Too many registration attempts, try again later",
      retryAfterSeconds,
    });
  },
});

// Deploy করার আগে মনে রাখার বিষয়: trust proxy

// তোমার server যদি Nginx, cPanel বা কোনো hosting proxy-র পিছনে চলে, তাহলে Express প্রতিটা request-এর IP হিসেবে proxy-র IP দেখবে। ফলে সবাই একই “IP” ধরা পড়বে, আর ৫টা ভুল চেষ্টায় আসল admin-ও আটকে যাবে। উল্টোদিকে trust proxy ভুল দিলে আক্রমণকারী X-Forwarded-For নকল করে limiter এড়াতে পারে। Hosting ঠিক হলে app.set('trust proxy', <সংখ্যা>) ঠিকমতো দিতে হবে। এখন dev-এ সমস্যা নেই, তালিকায় রেখে দাও।
