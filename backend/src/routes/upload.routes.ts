import { Router, type NextFunction, type Request, type Response } from "express";
import { uploadImage } from "../controllers/upload.controller.js";
import { hasAnyPermission, hasPermission } from "../lib/permissions.js";
import { createRateLimiter } from "../lib/rateLimit.js";
import { uploadImageMiddleware } from "../middleware/uploadImage.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Both shop users and super admins upload local images through this endpoint.
router.use(requireAuth);

function readFolder(req: Request): string {
  if (typeof req.query.folder === "string") return req.query.folder;
  const body: unknown = req.body;
  if (
    typeof body === "object" &&
    body !== null &&
    "folder" in body &&
    typeof body.folder === "string"
  ) {
    return body.folder;
  }
  return "products";
}

function requireUploadPermission(req: Request, res: Response, next: NextFunction) {
  const permissions = req.permissions;
  if (
    req.user?.role?.name === "super_admin" ||
    hasPermission(permissions, "*", "*")
  ) {
    return next();
  }

  const folder = readFolder(req);
  const checks: readonly (readonly [string, string])[] =
    folder === "banners" || folder === "logos"
      ? [
          ["settings", "update"],
          ["settings", "create"],
        ]
      : [
          ["products", "create"],
          ["products", "update"],
        ];

  // Unknown folders are rejected by the controller's 422 validation.
  if (
    !["products", "brands", "banners", "logos"].includes(folder) ||
    hasAnyPermission(permissions, checks)
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
  });
}

const uploadRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 30,
  message: "Too many uploads, try again in a minute.",
});

router.post(
  "/",
  requireUploadPermission,
  uploadRateLimit,
  uploadImageMiddleware,
  uploadImage
);

export default router;
