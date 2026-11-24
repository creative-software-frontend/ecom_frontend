import { Router } from "express";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  listCoupons,
  updateCoupon,
  updateCouponStatus,
} from "../controllers/adminCoupon.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listCoupons);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.patch("/:id/status", updateCouponStatus);
router.delete("/:id", deleteCoupon);

export default router;
