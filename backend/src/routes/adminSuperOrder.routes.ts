import { Router } from "express";
import {
  superGetOrderById,
  superListOrders,
  superUpdateOrderStatus,
} from "../controllers/adminSuperOrder.controller.js";

const router = Router();

router.get("/", superListOrders);
router.get("/:id", superGetOrderById);
router.patch("/:id/status", superUpdateOrderStatus);

export default router;
