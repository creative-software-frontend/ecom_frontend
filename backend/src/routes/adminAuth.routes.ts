import { Router } from "express";
import {
  login,
  logout,
  me,
  updateProfile,
} from "../controllers/adminAuth.controller.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.post("/login", loginRateLimit, login);
router.post("/logout", logout);
router.get("/me", requireAdmin, me);
router.put("/profile", requireAdmin, updateProfile);

export default router;
