import type { Request, Response } from "express";
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

  try {
    const [pendingOrders, totalProducts] = await Promise.all([
      prisma.order.count({ where: { shopId, status: "pending" } }),
      prisma.product.count({ where: { shopId, isActive: true } }),
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
