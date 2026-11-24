import { Router } from "express";
import {
  createShopUser,
  listAssignableShopRoles,
  listShopUsers,
  resetShopUserPassword,
  updateShopUser,
} from "../controllers/adminShopUser.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.use(requireAuth);
router.get("/", listShopUsers);
router.get("/roles", listAssignableShopRoles);
router.post("/", createShopUser);
router.patch("/:id/password", resetShopUserPassword);
router.patch("/:id", updateShopUser);

export default router;
