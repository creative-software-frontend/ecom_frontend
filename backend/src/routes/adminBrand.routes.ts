import { Router } from "express";
import {
  createBrand,
  deleteBrand,
  listBrands,
  updateBrand,
} from "../controllers/adminBrand.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("products", "read"), listBrands);
router.post("/", requirePermission("products", "create"), createBrand);
router.put("/:id", requirePermission("products", "update"), updateBrand);
router.delete("/:id", requirePermission("products", "delete"), deleteBrand);

export default router;
