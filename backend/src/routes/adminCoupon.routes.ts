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
import { requirePermission } from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

router.get("/", requirePermission("coupons", "read"), listCoupons);
router.get("/:id", requirePermission("coupons", "read"), getCouponById);
router.post("/", requirePermission("coupons", "create"), createCoupon);
router.put("/:id", requirePermission("coupons", "update"), updateCoupon);
router.patch("/:id/status", requirePermission("coupons", "update"), updateCouponStatus);
router.delete("/:id", requirePermission("coupons", "delete"), deleteCoupon);

export default router;
