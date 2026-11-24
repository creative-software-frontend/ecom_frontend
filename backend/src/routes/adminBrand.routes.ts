import { Router } from "express";
import {
  createBrand,
  deleteBrand,
  listBrands,
  updateBrand,
} from "../controllers/adminBrand.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listBrands);
router.post("/", createBrand);
router.put("/:id", updateBrand);
router.delete("/:id", deleteBrand);

export default router;
