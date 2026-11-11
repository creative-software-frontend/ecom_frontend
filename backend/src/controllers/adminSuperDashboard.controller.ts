import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

/* ================================================================
   Platform-wide metrics for the Super Admin dashboard.
   All counts include every shop and every user — no filtering.
   ================================================================ */

const TRIAL_WARNING_WINDOW_DAYS = 7;
const RECENT_AUDIT_LIMIT = 10;

export async function getSuperAdminDashboard(_req: Request, res: Response) {
  try {
    const now = new Date();
    const trialWarningThreshold = new Date(
      now.getTime() + TRIAL_WARNING_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    // Run all independent queries in parallel — reduces total latency.
    const [
      totalShops,
      activeShops,
      totalUsers,
      activeUsers,
      shopsByStatusRaw,
      usersByRoleRaw,
      recentAudits,
      trialExpiringSoon,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { status: "active" } }),
      prisma.user.count(),
      prisma.user.count({ where: { status: "active" } }),

      // Shops grouped by status string (active / inactive / trial).
      prisma.shop.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),

      // Users grouped by roleId; role names resolved in the next step.
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { _all: true },
      }),

      prisma.auditLog.findMany({
        take: RECENT_AUDIT_LIMIT,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          shop: { select: { id: true, name: true, slug: true } },
        },
      }),

      // Shops whose trial ends within the warning window.
      prisma.shop.findMany({
        where: {
          status: "trial",
          trialEndsAt: { not: null, lte: trialWarningThreshold },
        },
        orderBy: { trialEndsAt: "asc" },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          trialEndsAt: true,
        },
      }),
    ]);

    // Resolve role display names for the group-by result.
    const roleIds = usersByRoleRaw.map((g) => g.roleId);
    const roles = await prisma.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true, displayName: true },
    });
    const roleMap = new Map(roles.map((r) => [r.id, r]));

    return res.json({
      success: true,
      data: {
        metrics: {
          totalShops,
          activeShops,
          totalUsers,
          activeUsers,
        },
        shopsByStatus: shopsByStatusRaw.map((g) => ({
          status: g.status,
          count: g._count._all,
        })),
        usersByRole: usersByRoleRaw
          .map((g) => {
            const role = roleMap.get(g.roleId);
            return {
              roleId: g.roleId,
              roleName: role?.name ?? "unknown",
              roleDisplayName: role?.displayName ?? "Unknown",
              count: g._count._all,
            };
          })
          .sort((a, b) => b.count - a.count),
        recentAudits: recentAudits.map((a) => ({
          id: a.id,
          action: a.action,
          entityType: a.entityType,
          entityId: a.entityId,
          createdAt: a.createdAt,
          user: a.user,
          shop: a.shop,
        })),
        trialExpiringSoon,
      },
    });
  } catch (error) {
    console.error("getSuperAdminDashboard failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
