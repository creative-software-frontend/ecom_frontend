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

const router = Router();

router.use(requireAuth);

router.post("/", createShopOrder);
router.get("/", listOrders);
// Bulk route must be registered before /:id so it is never treated as an id.
router.post("/bulk-dispatch", bulkDispatchOrders);
router.post("/:id/dispatch", dispatchSingleOrder);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

export default router;
