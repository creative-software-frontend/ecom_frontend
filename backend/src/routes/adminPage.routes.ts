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

const router = Router();

router.use(requireAuth);

router.get("/", listPages);
router.get("/:id", getPageById);
router.post("/", createPage);
router.put("/:id", updatePage);
router.get("/:id/revisions", listPageRevisions);
router.post("/:id/revisions/:revisionId/restore", restorePageRevision);
router.delete("/:id", deletePage);

export default router;
