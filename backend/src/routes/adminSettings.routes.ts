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
import {
  createSmsTemplate,
  listSmsTemplates,
  updateSmsTemplate,
} from "../controllers/smsTemplate.controller.js";

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

// SMS templates
router.get("/sms/templates", listSmsTemplates);
router.post("/sms/templates", createSmsTemplate);
router.put("/sms/templates/:id", updateSmsTemplate);

export default router;
