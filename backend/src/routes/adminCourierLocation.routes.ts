import { Router } from "express";
import {
  getCourierAreas,
  getCourierCities,
  getCourierZones,
} from "../controllers/adminCourierDispatch.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireAnyPermission } from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

const canViewLocations = requireAnyPermission([
  ["orders", "update"],
  ["courier", "read"],
  ["courier", "update"],
]);

router.get("/:slug/cities", canViewLocations, getCourierCities);
router.get("/:slug/zones", canViewLocations, getCourierZones);
router.get("/:slug/areas", canViewLocations, getCourierAreas);

export default router;
