import { Router } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { createRateLimiter } from "../lib/rateLimit.js";
import { uploadImageMiddleware } from "../middleware/uploadImage.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Both shop users and super admins upload local images through this endpoint.
router.use(requireAuth);

const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  message: "Too many uploads, try again in a minute.",
});

router.post("/", uploadRateLimit, uploadImageMiddleware, uploadImage);

export default router;
