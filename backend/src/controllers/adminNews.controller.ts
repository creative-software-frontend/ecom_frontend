import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import {
  formatNewsValidationErrors,
  shopNewsListQuerySchema,
} from "../schemas/news.schema.js";

/**
 * Shop-facing read endpoint. News is platform-wide, but only authenticated
 * shop users may read it — super admins must use /api/admin/super/news.
 */
export async function listShopNews(req: Request, res: Response) {
  if (!req.user?.shopId) {
    return res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins must use /api/admin/super/news.",
    });
  }

  const parsed = shopNewsListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatNewsValidationErrors(parsed.error),
    });
  }

  const { q, category } = parsed.data;
  const baseWhere: Prisma.NewsWhereInput = { status: "published" };
  const where: Prisma.NewsWhereInput = {
    ...baseWhere,
    ...(category !== "all" ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : {}),
  };

  try {
    const [items, totalPublished] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: [
          { isPinned: "desc" },
          { publishedAt: "desc" },
          { id: "desc" },
        ],
      }),
      prisma.news.count({ where: baseWhere }),
    ]);

    return res.status(200).json({
      success: true,
      data: { items, totalPublished },
    });
  } catch (error) {
    console.error("Error fetching shop news:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
