import { Router } from "express";
import {
  createPage,
  deletePage,
  getPageById,
  listPageRevisions,
  listPages,
  restorePageRevision,
  updatePage,
} from "../controllers/adminPage.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("pages", "read"), listPages);
router.get("/:id", requirePermission("pages", "read"), getPageById);
router.post("/", requirePermission("pages", "create"), createPage);
router.put("/:id", requirePermission("pages", "update"), updatePage);
router.get("/:id/revisions", requirePermission("pages", "read"), listPageRevisions);
router.post(
  "/:id/revisions/:revisionId/restore",
  requirePermission("pages", "update"),
  restorePageRevision
);
router.delete("/:id", requirePermission("pages", "delete"), deletePage);

export default router;
