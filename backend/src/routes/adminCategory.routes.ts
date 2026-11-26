import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from "../controllers/adminCategory.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("products", "read"), listCategories);
router.post("/", requirePermission("products", "create"), createCategory);
router.put("/:id", requirePermission("products", "update"), updateCategory);
router.delete("/:id", requirePermission("products", "delete"), deleteCategory);

export default router;
