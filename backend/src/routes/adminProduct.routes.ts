import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  updateProduct,
} from "../controllers/adminProduct.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

router.get("/", listProducts);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
