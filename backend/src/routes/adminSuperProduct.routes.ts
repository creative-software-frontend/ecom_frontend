import { Router } from "express";
import {
  superListProducts,
  superGetProductById,
  superCreateProduct,
  superUpdateProduct,
  superDeleteProduct,
  blockProduct,
  unblockProduct,
} from "../controllers/adminSuperProduct.controller.js";

const router = Router();

router.get("/", superListProducts);
router.get("/:id", superGetProductById);
router.post("/", superCreateProduct);
router.put("/:id", superUpdateProduct);
router.delete("/:id", superDeleteProduct);
router.patch("/:id/block", blockProduct);
router.patch("/:id/unblock", unblockProduct);

export default router;
