import { Router } from "express";
import {
  getProductBySlug,
  getProducts,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);

export default router;
