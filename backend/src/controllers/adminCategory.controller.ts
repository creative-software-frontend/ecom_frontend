import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { buildCatalogSlug } from "../lib/catalogSlug.js";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import {
  categoryInputSchema,
  categoryListQuerySchema,
  categoryUpdateInputSchema,
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
        "Shop-scoped endpoint. Super admins cannot manage shop categories here.",
    });
    return null;
  }
  return shopId;
}

function handleCategoryPrismaError(
  error: unknown,
  res: Response,
): Response | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      success: false,
      message: "A category with a similar name already exists.",
      errors: { name: "This name is already taken in your shop." },
    });
  }
  return sendPrismaError(error, res);
}

function notFound(res: Response) {
  return res
    .status(404)
    .json({ success: false, message: "Category not found" });
}

function validationError(res: Response, message: string, field: string) {
  return res.status(422).json({
    success: false,
    message,
    errors: { [field]: message },
  });
}

function slugTakenMessage(res: Response) {
  return res.status(409).json({
    success: false,
    message: "A category with a similar name already exists.",
    errors: { name: "This name is already taken in your shop." },
  });
}

function countMap(rows: Array<{ name: string | null; count: number }>) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (!row.name || !row.name.trim()) continue;
    const key = row.name.trim().toLowerCase();
    map.set(key, (map.get(key) ?? 0) + row.count);
  }
  return map;
}

/* ================================================================
   Endpoints
   ================================================================ */

export async function listCategories(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = categoryListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  const { q, status, level } = parsed.data;
  const where: Prisma.CategoryWhereInput = {
    shopId,
    ...(status !== "all" ? { isActive: status === "active" } : {}),
    ...(level === "parent"
      ? { parentId: null }
      : level === "subcategory"
        ? { parentId: { not: null } }
        : {}),
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
    // Counts are shop-wide and ignore filters, matching the coupon list.
    const [all, filtered, categoryGroups, subcategoryGroups] = await Promise.all(
      [
        prisma.category.findMany({
          where: { shopId },
          select: { id: true, name: true, parentId: true, isActive: true },
        }),
        prisma.category.findMany({
          where,
          orderBy: [{ parentId: "asc" }, { name: "asc" }],
          include: {
            parent: { select: { id: true, name: true } },
            _count: { select: { children: true } },
          },
        }),
        prisma.product.groupBy({
          by: ["category"],
          where: { shopId },
          _count: { _all: true },
        }),
        prisma.product.groupBy({
          by: ["subcategory"],
          where: { shopId, subcategory: { not: null } },
          _count: { _all: true },
        }),
      ],
    );

    const categoryCounts = countMap(
      categoryGroups.map((group) => ({
        name: group.category,
        count: group._count._all,
      })),
    );
    const subcategoryCounts = countMap(
      subcategoryGroups.map((group) => ({
        name: group.subcategory,
        count: group._count._all,
      })),
    );
    const countFor = (category: { name: string; parentId: number | null }) =>
      (category.parentId === null
        ? categoryCounts
        : subcategoryCounts
      ).get(category.name.trim().toLowerCase()) ?? 0;

    const counts = {
      total: all.length,
      parents: all.filter((category) => category.parentId === null).length,
      subcategories: all.filter((category) => category.parentId !== null)
        .length,
      active: all.filter((category) => category.isActive).length,
      inactive: all.filter((category) => !category.isActive).length,
      linkedProducts: all.reduce(
        (sum, category) => sum + countFor(category),
        0,
      ),
      empty: all.filter((category) => countFor(category) === 0).length,
    };

    const items = filtered.map((category) => ({
      ...category,
      parentName: category.parent?.name ?? null,
      childrenCount: category._count.children,
      productCount: countFor(category),
    }));

    return res.status(200).json({ success: true, data: { items, counts } });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createCategory(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = categoryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  const input = parsed.data;
  try {
    let parentId: number | null = null;
    if (input.parentId !== null) {
      const parent = await prisma.category.findFirst({
        where: { id: input.parentId, shopId },
        select: { id: true, parentId: true },
      });
      if (!parent) {
        return validationError(
          res,
          "Parent category not found in your shop.",
          "parentId",
        );
      }
      if (parent.parentId !== null) {
        return validationError(
          res,
          "Subcategories can only be placed under a top-level category.",
          "parentId",
        );
      }
      parentId = parent.id;
    }

    const slug = buildCatalogSlug(input.name, "category");
    const existing = await prisma.category.findFirst({
      where: { shopId, slug },
      select: { id: true },
    });
    if (existing) return slugTakenMessage(res);

    const category = await prisma.category.create({
      data: {
        shopId,
        parentId,
        name: input.name,
        slug,
        description: input.description ?? null,
        isActive: input.isActive,
      },
    });

    void logAudit({
      req,
      action: "category.create",
      entityType: "category",
      entityId: category.id,
      targetShopId: shopId,
      metadata: { name: category.name, slug: category.slug, parentId },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    const handled = handleCategoryPrismaError(error, res);
    if (handled) return handled;
    console.error("Error creating category:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateCategory(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  const parsed = categoryUpdateInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCatalogValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.category.findFirst({
      where: { id, shopId },
      include: { _count: { select: { children: true } } },
    });
    if (!existing) return notFound(res);

    const input = parsed.data;
    let parentId: number | null | undefined;
    if (input.parentId !== undefined && input.parentId !== null) {
      if (input.parentId === id) {
        return validationError(
          res,
          "A category cannot be its own parent.",
          "parentId",
        );
      }
      if (existing._count.children > 0) {
        return validationError(
          res,
          "Remove or move subcategories before converting this into a subcategory.",
          "parentId",
        );
      }
      const parent = await prisma.category.findFirst({
        where: { id: input.parentId, shopId },
        select: { id: true, parentId: true },
      });
      if (!parent || parent.parentId !== null) {
        return validationError(
          res,
          "Subcategories can only be placed under a top-level category.",
          "parentId",
        );
      }
      parentId = parent.id;
    } else if (input.parentId === null) {
      parentId = null;
    }

    // Slug is deliberately absent: it is locked after creation.
    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        ...(input.description !== undefined
          ? { description: input.description }
          : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });

    void logAudit({
      req,
      action: "category.update",
      entityType: "category",
      entityId: category.id,
      targetShopId: shopId,
      metadata: { name: category.name, slug: category.slug },
    });

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    const handled = handleCategoryPrismaError(error, res);
    if (handled) return handled;
    console.error("Error updating category:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteCategory(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) return notFound(res);

  try {
    const existing = await prisma.category.findFirst({
      where: { id, shopId },
      include: { _count: { select: { children: true } } },
    });
    if (!existing) return notFound(res);

    if (existing._count.children > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete a category that has subcategories. Delete or move them first.",
      });
    }

    await prisma.category.delete({ where: { id } });

    void logAudit({
      req,
      action: "category.delete",
      entityType: "category",
      entityId: id,
      targetShopId: shopId,
      metadata: { name: existing.name, slug: existing.slug },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    const handled = handleCategoryPrismaError(error, res);
    if (handled) return handled;
    console.error("Error deleting category:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
