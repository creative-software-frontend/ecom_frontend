import { Router } from "express";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "../controllers/adminUser.controller.js";
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/adminRole.controller.js";
import {
  listShops,
  createShop,
  updateShop,
} from "../controllers/adminShop.controller.js";
import { listAuditLogs } from "../controllers/adminAudit.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireSuperAdmin } from "../middleware/requireSuperAdmin.js";
import { getSuperAdminDashboard } from "../controllers/adminSuperDashboard.controller.js";

const router = Router();

// Everything under /api/admin/super requires both auth AND super_admin role.
router.use(requireAuth);
router.use(requireSuperAdmin);

// Dashboard
router.get("/dashboard", getSuperAdminDashboard);

// Users
router.get("/users", listUsers);
router.post("/users", createUser);
router.patch("/users/:id", updateUser);
router.patch("/users/:id/password", resetUserPassword);
router.delete("/users/:id", deleteUser);

// Roles
router.get("/roles", listRoles);
router.post("/roles", createRole);
router.patch("/roles/:id", updateRole);
router.delete("/roles/:id", deleteRole);

// Shops
router.get("/shops", listShops);
router.post("/shops", createShop);
router.patch("/shops/:id", updateShop);

// Audit log
router.get("/audit", listAuditLogs);

export default router;
