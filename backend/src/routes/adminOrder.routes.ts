import { Router } from "express";
import {
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/adminOrder.controller.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = Router();

router.use(requireAdmin);

router.get("/", listOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

export default router;

