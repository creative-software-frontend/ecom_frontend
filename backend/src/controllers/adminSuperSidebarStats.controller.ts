import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/**
 * Sidebar badge counts for the Super Admin.
 * Keep this endpoint lightweight — only counts, no full records.
 */
export async function getSuperAdminSidebarStats(_req: Request, res: Response) {
  try {
    const [totalUsers, totalShops, totalRoles] = await Promise.all([
      prisma.user.count(),
      prisma.shop.count(),
      prisma.role.count(),
    ]);

    return res.json({
      success: true,
      data: { totalUsers, totalShops, totalRoles },
    });
  } catch (error) {
    console.error("Error fetching super admin sidebar stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
