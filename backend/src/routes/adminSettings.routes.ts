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
import {
  disconnectCourierAccount,
  listCourierAccounts,
  testCourierAccount,
  toggleCourierAccount,
  toggleCourierSandbox,
  upsertCourierAccount,
} from "../controllers/adminCourierAccount.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requirePermission } from "../middleware/requirePermission.js";
import {
  createSmsTemplate,
  deleteSmsTemplate,
  listSmsTemplates,
  updateSmsTemplate,
} from "../controllers/smsTemplate.controller.js";

const router = Router();
router.use(requireAuth);

// Store settings
router.get("/store", requirePermission("settings", "read"), getStoreSettings);
router.put("/store", requirePermission("settings", "update"), updateStoreSettings);

// Storefront settings
router.get("/storefront", requirePermission("settings", "read"), getStorefrontSettings);
router.put(
  "/storefront",
  requirePermission("settings", "update"),
  updateStorefrontSettings
);

// Order settings
router.get("/orders", requirePermission("settings", "read"), getOrderSettings);
router.put("/orders", requirePermission("settings", "update"), updateOrderSettings);

// Courier settings
router.get("/courier", requirePermission("courier", "read"), getCourierSettings);
router.put("/courier", requirePermission("courier", "update"), updateCourierSettings);

// Courier accounts (per-shop encrypted credentials)
router.get("/courier/accounts", requirePermission("courier", "read"), listCourierAccounts);
router.put(
  "/courier/accounts/:slug",
  requirePermission("courier", "update"),
  upsertCourierAccount
);
router.patch(
  "/courier/accounts/:slug/toggle",
  requirePermission("courier", "update"),
  toggleCourierAccount
);
router.patch(
  "/courier/accounts/:slug/sandbox",
  requirePermission("courier", "update"),
  toggleCourierSandbox
);
router.post(
  "/courier/accounts/:slug/test",
  requirePermission("courier", "update"),
  testCourierAccount
);
router.delete(
  "/courier/accounts/:slug/credentials",
  requirePermission("courier", "delete"),
  disconnectCourierAccount
);

// SMS templates
router.get("/sms/templates", requirePermission("settings", "read"), listSmsTemplates);
router.post("/sms/templates", requirePermission("settings", "create"), createSmsTemplate);
router.put("/sms/templates/:id", requirePermission("settings", "update"), updateSmsTemplate);
router.delete("/sms/templates/:id", requirePermission("settings", "delete"), deleteSmsTemplate);

export default router;
