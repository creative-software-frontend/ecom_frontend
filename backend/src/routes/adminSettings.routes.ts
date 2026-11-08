import { Router } from "express";
import {
  getStoreSettings,
  updateStoreSettings,
} from "../controllers/adminStoreSettings.controller.js";
import {
  getStorefrontSettings,
  updateStorefrontSettings,
} from "../controllers/adminStorefrontSettings.controller.js";
import {
  getOrderSettings,
  updateOrderSettings,
} from "../controllers/adminOrderSettings.controller.js";
import { changePassword } from "../controllers/adminSettings.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getCourierSettings,
  updateCourierSettings,
} from "../controllers/adminCourierSettings.controller.js";

const router = Router();
router.use(requireAdmin);

// Store
router.get("/store", getStoreSettings);
router.put("/store", updateStoreSettings);

// Storefront
router.get("/storefront", getStorefrontSettings);
router.put("/storefront", updateStorefrontSettings);

// Order settings
router.get("/orders", getOrderSettings);
router.put("/orders", updateOrderSettings);

// Courier (Phase 2.5)
router.get("/courier", getCourierSettings);
router.put("/courier", updateCourierSettings);

// Password — endpoint stays even without current UI (Phase 6 will re-add UI)
router.put("/password", changePassword);

export default router;
