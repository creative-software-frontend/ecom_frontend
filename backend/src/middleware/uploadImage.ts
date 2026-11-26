import type { NextFunction, Request, Response } from "express";
import multer, { MulterError } from "multer";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Image bytes stay in memory — sharp validates and converts them before any disk write. */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, or WebP images are allowed."));
    }
    cb(null, true);
  },
}).single("image");

/** Translate multer errors into the API's JSON envelope — never an HTML 500. */
export function uploadImageMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  upload(req, res, (error: unknown) => {
    if (!error) {
      return next();
    }

    if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Image must be 5 MB or smaller.",
      });
    }

    const message =
      error instanceof Error && error.message
        ? error.message
        : "Invalid image upload.";
    return res.status(422).json({ success: false, message });
  });
}
