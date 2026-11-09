import { Router } from "express";
import {
  login,
  logout,
  me,
  updateProfile,
} from "../controllers/adminAuth.controller.js";
import { loginRateLimit } from "../middleware/loginRateLimit.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/login", loginRateLimit, login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);

export default router;
