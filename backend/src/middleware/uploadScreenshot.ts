import multer from "multer";

/**
 * Memory storage — screenshot lives in memory during OCR, then discarded.
 * No disk write, no persistence — that's the recharge-submission step later.
 */
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const uploadScreenshot = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WebP images are allowed."));
    }
    cb(null, true);
  },
}).single("screenshot");
