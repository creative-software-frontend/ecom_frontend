import { Router } from "express";
import { getDashboard } from "../controllers/adminDashboard.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(requireAdmin);
router.get("/", getDashboard);

export default router;
