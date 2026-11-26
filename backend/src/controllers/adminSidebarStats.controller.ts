import type { Request, Response } from "express";
import { hasPermission } from "../lib/permissions.js";
import { prisma } from "../lib/prisma.js";

export async function getSidebarStats(req: Request, res: Response) {
  const shopId = req.user?.shopId;
  if (!shopId) {
    return res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins must use /api/admin/super/sidebar-stats.",
    });
  }

  // Badge counts are informational: omit the ones this user cannot read
  // rather than denying the whole stats request.
  const canReadOrders = hasPermission(req.permissions, "orders", "read");
  const canReadProducts = hasPermission(req.permissions, "products", "read");

  try {
    const [pendingOrders, totalProducts] = await Promise.all([
      canReadOrders
        ? prisma.order.count({ where: { shopId, status: "pending" } })
        : Promise.resolve(0),
      canReadProducts
        ? prisma.product.count({ where: { shopId, isActive: true } })
        : Promise.resolve(0),
    ]);

    return res.json({
      success: true,
      data: {
        pendingOrders,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching sidebar stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
