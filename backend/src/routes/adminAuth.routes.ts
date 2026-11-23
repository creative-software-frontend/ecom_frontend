import { Router } from "express";
import {
  login,
  register,
<<<<<<< HEAD
=======
  requestRegistrationMobileVerification,
  verifyRegistrationMobile,
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
  logout,
  me,
  updateProfile,
} from "../controllers/adminAuth.controller.js";
import { changePassword } from "../controllers/adminSettings.controller.js";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middleware/loginRateLimit.js";
<<<<<<< HEAD
=======
import {
  registrationOtpRequestRateLimit,
  registrationOtpVerifyRateLimit,
} from "../middleware/mobileVerificationRateLimit.js";
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Public — no auth required
router.post("/login", loginRateLimit, login);
<<<<<<< HEAD
=======
router.post(
  "/register/mobile/request-code",
  registrationOtpRequestRateLimit,
  requestRegistrationMobileVerification,
);
router.post(
  "/register/mobile/verify-code",
  registrationOtpVerifyRateLimit,
  verifyRegistrationMobile,
);
>>>>>>> 943589b71143456bbd5207a815a53a15c35d7a01
router.post("/register", registrationRateLimit, register);
router.post("/logout", logout);

// Authenticated — same user, any role
router.get("/me", requireAuth, me);
router.put("/profile", requireAuth, updateProfile);
router.put("/password", requireAuth, changePassword);

export default router;
