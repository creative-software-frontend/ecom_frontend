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
import {
  getCourierSettings,
  updateCourierSettings,
} from "../controllers/adminCourierSettings.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth);

// Store settings
router.get("/store", getStoreSettings);
router.put("/store", updateStoreSettings);

// Storefront settings
router.get("/storefront", getStorefrontSettings);
router.put("/storefront", updateStorefrontSettings);

// Order settings
router.get("/orders", getOrderSettings);
router.put("/orders", updateOrderSettings);

// Courier settings
router.get("/courier", getCourierSettings);
router.put("/courier", updateCourierSettings);

export default router;
