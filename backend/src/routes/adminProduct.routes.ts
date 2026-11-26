import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/adminProduct.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();
router.use(requireAuth);

router.get("/", requirePermission("products", "read"), listProducts);
router.get("/:id", requirePermission("products", "read"), getProductById);
router.post("/", requirePermission("products", "create"), createProduct);
router.put("/:id", requirePermission("products", "update"), updateProduct);
router.delete("/:id", requirePermission("products", "delete"), deleteProduct);

export default router;
