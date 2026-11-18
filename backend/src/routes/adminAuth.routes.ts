import { Router } from "express";
import {
  login,
  register,
  logout,
  me,
  updateProfile,
} from "../controllers/adminAuth.controller.js";
import { changePassword } from "../controllers/adminSettings.controller.js";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middleware/loginRateLimit.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Public — no auth required
router.post("/login", loginRateLimit, login);
router.post("/register", registrationRateLimit, register);
router.post("/logout", logout);

// Authenticated — same user, any role
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);

export default router;
