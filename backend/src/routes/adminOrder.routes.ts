import { Router } from "express";
import {
  createShopOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from "../controllers/adminOrder.controller.js";
import {
  bulkDispatchOrders,
  dispatchSingleOrder,
} from "../controllers/adminCourierDispatch.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  requireAnyPermission,
  requirePermission,
} from "../middleware/requirePermission.js";

const router = Router();

router.use(requireAuth);

const canDispatch = requireAnyPermission([
  ["orders", "update"],
  ["courier", "update"],
]);

router.post("/", requirePermission("orders", "create"), createShopOrder);
router.get("/", requirePermission("orders", "read"), listOrders);
// Bulk route must be registered before /:id so it is never treated as an id.
router.post("/bulk-dispatch", canDispatch, bulkDispatchOrders);
router.post("/:id/dispatch", canDispatch, dispatchSingleOrder);
router.get("/:id", requirePermission("orders", "read"), getOrderById);
router.patch("/:id/status", requirePermission("orders", "update"), updateOrderStatus);

export default router;
