import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { buildCatalogSlug } from "../lib/catalogSlug.js";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import {
  brandInputSchema,
  brandListQuerySchema,
  brandUpdateInputSchema,
  formatCatalogValidationErrors,
} from "../schemas/catalog.schema.js";

/* ================================================================
   Helpers
   ================================================================ */

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins cannot manage shop brands here.",
    });
    return null;
  }
  return shopId;
}

function handleBrandPrismaError(
  error: unknown,
  res: Response,
): Response | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "A brand with a similar name already exists.",
      errors: { name: "This name is already taken in your shop." },
    });
  }
  return sendPrismaError(error, res);
}

function notFound(res: Response) {
  return res.status(404).json({ success: false, message: "Brand not found" });
}

/* ================================================================
   Endpoints
   ================================================================ */

export async function listBrands(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = brandListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  const { q, status } = parsed.data;
  const where: Prisma.BrandWhereInput = {
    shopId,
    ...(status !== "all" ? { isActive: status === "active" } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { slug: { contains: q } },
          ],
        }
      : {}),
  };

  try {
    // Counts are shop-wide and ignore q/status so the metric cards stay
    // accurate while searching, matching the coupon list behaviour.
    const [brands, filtered, groups] = await Promise.all([
      prisma.brand.findMany({
        where: { shopId },
        select: { id: true, name: true, isActive: true },
      }),
      prisma.brand.findMany({ where, orderBy: { name: "asc" } }),
      prisma.product.groupBy({
        by: ["brandName"],
        where: { shopId },
        _count: { _all: true },
      }),
    ]);

    const productCounts = new Map<string, number>();
    for (const group of groups) {
      const key = group.brandName.trim().toLowerCase();
      productCounts.set(key, (productCounts.get(key) ?? 0) + group._count._all);
    }
    const countFor = (name: string) =>
      productCounts.get(name.trim().toLowerCase()) ?? 0;

    const counts = {
      total: brands.length,
      active: brands.filter((brand) => brand.isActive).length,
      inactive: brands.filter((brand) => !brand.isActive).length,
      linkedProducts: brands.reduce(
        (sum, brand) => sum + countFor(brand.name),
        0,
      ),
      empty: brands.filter((brand) => countFor(brand.name) === 0).length,
    };

    const items = filtered.map((brand) => ({
      ...brand,
      productCount: countFor(brand.name),
    }));

    return res.status(200).json({ success: true, data: { items, counts } });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createBrand(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = brandInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  try {
    const slug = buildCatalogSlug(parsed.data.name, "brand");
    const existing = await prisma.brand.findFirst({
      where: { shopId, slug },
      select: { id: true },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A brand with a similar name already exists.",
        errors: { name: "This name is already taken in your shop." },
      });
    }

    const input = parsed.data;
    const brand = await prisma.brand.create({
      data: {
        shopId,
        name: input.name,
        slug,
        logoUrl: input.logoUrl ?? null,
        description: input.description ?? null,
        isActive: input.isActive,
      },
    });

    void logAudit({
      req,
      action: "brand.create",
      entityType: "brand",
      entityId: brand.id,
      targetShopId: shopId,
      metadata: { name: brand.name, slug: brand.slug },
    });

    return res.status(201).json({ success: true, data: brand });
  } catch (error) {
    const handled = handleBrandPrismaError(error, res);
    if (handled) return handled;
    console.error("Error creating brand:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateBrand(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = brandUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.brand.findFirst({
      where: { id, shopId },
      select: { id: true },
    });
    if (!existing) return notFound(res);

    const input = parsed.data;
    // Slug is deliberately absent: it is locked after creation.
    const brand = await prisma.brand.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    void logAudit({
      req,
      action: "brand.update",
      entityType: "brand",
      entityId: brand.id,
      targetShopId: shopId,
      metadata: { name: brand.name, slug: brand.slug },
    });

    return res.status(200).json({ success: true, data: brand });
  } catch (error) {
    const handled = handleBrandPrismaError(error, res);
    if (handled) return handled;
    console.error("Error updating brand:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteBrand(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const existing = await prisma.brand.findFirst({
      where: { id, shopId },
      select: { id: true, name: true },
    });
    if (!existing) return notFound(res);

    // Products keep their string brandName; no product rows are touched.
    await prisma.brand.delete({ where: { id } });

    void logAudit({
      req,
      action: "brand.delete",
      entityType: "brand",
      entityId: id,
      targetShopId: shopId,
      metadata: { name: existing.name },
    });

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully.",
    });
  } catch (error) {
    const handled = handleBrandPrismaError(error, res);
    if (handled) return handled;
    console.error("Error deleting brand:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
