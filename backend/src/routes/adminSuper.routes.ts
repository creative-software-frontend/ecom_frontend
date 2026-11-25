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
import { getSuperAdminSidebarStats } from "../controllers/adminSuperSidebarStats.controller.js";
import { getShopCatalogOptions } from "../controllers/adminSuperCatalog.controller.js";
import adminSuperProductRoutes from "./adminSuperProduct.routes.js";
import adminSuperOrderRoutes from "./adminSuperOrder.routes.js";
import adminSuperNewsRoutes from "./adminSuperNews.routes.js";
import adminSuperSupportRoutes from "./adminSuperSupport.routes.js";

const router = Router();

// Everything under /api/admin/super requires both auth AND super_admin role.
router.use(requireAuth);
router.use(requireSuperAdmin);

// Dashboard
router.get("/dashboard", getSuperAdminDashboard);

// Sidebar stats — badge counts
router.get("/sidebar-stats", getSuperAdminSidebarStats);

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

// Catalog options for the super-admin product form (read-only, per shop)
router.get("/shops/:id/catalog-options", getShopCatalogOptions);

// Products
router.use("/products", adminSuperProductRoutes);

// Orders
router.use("/orders", adminSuperOrderRoutes);

// News & announcements
router.use("/news", adminSuperNewsRoutes);

// Support inbox
router.use("/support", adminSuperSupportRoutes);

// Audit log
router.get("/audit", listAuditLogs);

export default router;
