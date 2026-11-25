import { Router } from "express";
import {
  superCreateNews,
  superDeleteNews,
  superListNews,
  superUpdateNews,
} from "../controllers/adminSuperNews.controller.js";

const router = Router();

// Auth + super_admin guard are applied by /api/admin/super.
router.get("/", superListNews);
router.post("/", superCreateNews);
router.put("/:id", superUpdateNews);
router.delete("/:id", superDeleteNews);

export default router;
