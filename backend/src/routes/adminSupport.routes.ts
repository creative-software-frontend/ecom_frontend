import { Router } from "express";
import {
  closeShopTicket,
  createShopTicket,
  getShopTicketById,
  listShopTickets,
  replyShopTicket,
} from "../controllers/adminSupport.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);

router.get("/", listShopTickets);
router.post("/", createShopTicket);
router.get("/:id", getShopTicketById);
router.post("/:id/messages", replyShopTicket);
router.patch("/:id/close", closeShopTicket);

export default router;
