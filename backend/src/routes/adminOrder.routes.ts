import { Router } from "express";
import {
  createShopOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/adminOrder.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.post("/", createShopOrder);
router.get("/", listOrders);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

export default router;
