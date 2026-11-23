import {
  createRateLimiter,
  REGISTRATION_WINDOW_MS,
} from "../lib/rateLimit.js";

export const loginRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: "Too many attempts, try again later",
  skipSuccessfulRequests: true,
});

export const registrationRateLimit = createRateLimiter({
  windowMs: REGISTRATION_WINDOW_MS,
  limit: 3,
  message: "Too many registration attempts, try again later",
  includeRetryAfter: true,
});

export const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts, try again later",
    });
  },
});

// Deploy করার আগে মনে রাখার বিষয়: trust proxy

// তোমার server যদি Nginx, cPanel বা কোনো hosting proxy-র পিছনে চলে, তাহলে Express প্রতিটা request-এর IP হিসেবে proxy-র IP দেখবে। ফলে সবাই একই “IP” ধরা পড়বে, আর ৫টা ভুল চেষ্টায় আসল admin-ও আটকে যাবে। উল্টোদিকে trust proxy ভুল দিলে আক্রমণকারী X-Forwarded-For নকল করে limiter এড়াতে পারে। Hosting ঠিক হলে app.set('trust proxy', <সংখ্যা>) ঠিকমতো দিতে হবে। এখন dev-এ সমস্যা নেই, তালিকায় রেখে দাও।
