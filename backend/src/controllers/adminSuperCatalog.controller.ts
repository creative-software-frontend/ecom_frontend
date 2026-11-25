import type { Request, Response } from "express";
import { parseId } from "../lib/parseId.js";
import { prisma } from "../lib/prisma.js";

/**
 * Read-only catalog options for a specific shop. Used by the super-admin
 * product form, which cannot call the shop-scoped catalog endpoints.
 */
export async function getShopCatalogOptions(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Shop not found" });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    const [brands, categories] = await Promise.all([
      prisma.brand.findMany({
        where: { shopId: id, isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      prisma.category.findMany({
        where: { shopId: id, isActive: true },
        select: { id: true, name: true, slug: true, parentId: true },
        orderBy: [{ parentId: "asc" }, { name: "asc" }],
      }),
    ]);

    return res
      .status(200)
      .json({ success: true, data: { brands, categories } });
  } catch (error) {
    console.error("Error fetching shop catalog options:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
