import { Router } from "express";
import { getSidebarStats } from "../controllers/adminSidebarStats.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();
router.use(requireAuth); // যেকোনো অথেনটিকেটেড ইউজার দেখতে পারবে
router.get("/", getSidebarStats);

export default router;
