import { Router } from "express";
import { getDashboard } from "../controllers/adminDashboard.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);
router.get("/", getDashboard);

export default router;
