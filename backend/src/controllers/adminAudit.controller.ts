import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";

export async function listAuditLogs(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
  const limit = Math.min(
    200,
    Math.max(1, parseInt(String(req.query.limit ?? "50"), 10) || 50),
  );

  const where: Prisma.AuditLogWhereInput = {};
  const search =
    typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (search) {
    where.OR = [
      { action: { contains: search } },
      { entityType: { contains: search } },
      { entityId: { contains: search } },
      { ipAddress: { contains: search } },
      { user: { is: { name: { contains: search } } } },
      { user: { is: { email: { contains: search } } } },
      { shop: { is: { name: { contains: search } } } },
      { shop: { is: { slug: { contains: search } } } },
    ];
  }
  if (typeof req.query.userId === "string") {
    const userId = parseId(req.query.userId);
    if (userId === null) {
      return res.status(422).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    where.userId = userId;
  }
  if (typeof req.query.shopId === "string") {
    const shopId = parseId(req.query.shopId);
    if (shopId === null) {
      return res.status(422).json({
        success: false,
        message: "Invalid shop ID",
      });
    }
    where.shopId = shopId;
  }
  if (typeof req.query.action === "string") where.action = req.query.action;
  if (typeof req.query.dateFrom === "string") {
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) ?? {}),
      gte: new Date(req.query.dateFrom),
    };
  }
  if (typeof req.query.dateTo === "string") {
    where.createdAt = {
      ...((where.createdAt as Prisma.DateTimeFilter) ?? {}),
      lte: new Date(req.query.dateTo),
    };
  }

  try {
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
          shop: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);
    return res.json({
      success: true,
      data: {
        items: items.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          metadata: l.metadata,
          ipAddress: l.ipAddress,
          userAgent: l.userAgent,
          createdAt: l.createdAt,
          user: l.user,
          shop: l.shop,
        })),
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error("listAuditLogs failed:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
