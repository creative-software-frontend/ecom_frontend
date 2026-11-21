import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { uploadScreenshot } from "../middleware/uploadScreenshot.js";
import { extractRechargeDetails } from "../controllers/rechargeExtract.controller.js";
import rateLimit from "express-rate-limit";

// OCR is CPU-heavy — cap at 10/minute per IP.
const ocrRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many OCR requests. Please wait a minute.",
    });
  },
});

const router = Router();
router.use(requireAuth);
router.post("/extract", ocrRateLimit, uploadScreenshot, extractRechargeDetails);

export default router;
