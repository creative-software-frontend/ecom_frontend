import { Router } from "express";
import {
  getCourierAreas,
  getCourierCities,
  getCourierZones,
} from "../controllers/adminCourierDispatch.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/:slug/cities", getCourierCities);
router.get("/:slug/zones", getCourierZones);
router.get("/:slug/areas", getCourierAreas);

export default router;
