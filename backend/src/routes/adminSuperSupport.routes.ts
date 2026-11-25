import { Router } from "express";
import {
  superGetTicketById,
  superListTickets,
  superReplyTicket,
  superUpdateTicketStatus,
} from "../controllers/adminSuperSupport.controller.js";

const router = Router();

// Auth + super_admin guard are applied by /api/admin/super.
router.get("/", superListTickets);
router.get("/:id", superGetTicketById);
router.post("/:id/messages", superReplyTicket);
router.patch("/:id/status", superUpdateTicketStatus);

export default router;
