import { Router } from "express";
import { listShopNews } from "../controllers/adminNews.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listShopNews);

export default router;
