import { Router } from "express";
import {
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/adminOrder.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

export default router;
