import { Router } from "express";
import {
  changePassword,
  getSettings,
  updateStoreSettings,
} from "../controllers/adminSettings.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

router.get("/", getSettings);
router.put("/", updateStoreSettings);
router.put("/password", changePassword);

export default router;

