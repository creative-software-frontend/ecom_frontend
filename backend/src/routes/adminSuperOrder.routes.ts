import { Router } from "express";
import {
  superCreateOrder,
  superGetOrderById,
  superListOrders,
  superUpdateOrderStatus,
} from "../controllers/adminSuperOrder.controller.js";

const router = Router();

router.post("/", superCreateOrder);
router.get("/", superListOrders);
router.get("/:id", superGetOrderById);
router.patch("/:id/status", superUpdateOrderStatus);

export default router;
