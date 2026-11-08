import { Router } from "express";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../controllers/adminStoreSettings.controller.js";
import { changePassword } from "../controllers/adminSettings.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();
router.use(requireAdmin);

// Store settings — DB-backed (Phase 1)
router.get("/store", getStoreSettings);
router.put("/store", updateStoreSettings);

// Password change — legacy but still in use
router.put("/password", changePassword);

export default router;
