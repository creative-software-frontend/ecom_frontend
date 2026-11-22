import type { Request, Response } from "express";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/auditLog.js";
import {
  formatProductValidationErrors,
  productInputSchema,
  type ProductInput,
} from "../schemas/product.schema.js";

/* ================================================================
   Helpers
   ================================================================ */

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

/**
 * Server-generated slug. If name has no Latin chars → random fallback.
 * On conflict returns `conflict: true` (no auto -2; caller shows 409).
 */
async function generateProductSlug(
  name: string,
): Promise<{ slug: string; conflict: boolean }> {
  const base = slugify(name);
  if (!base) {
    for (let i = 0; i < 5; i++) {
      const slug = `product-${Math.random().toString(36).substring(2, 8)}`;
      const exists = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!exists) return { slug, conflict: false };
    }
    throw new Error("Could not generate unique slug after 5 attempts");
  }
  const exists = await prisma.product.findUnique({
    where: { slug: base },
    select: { id: true },
  });
  return { slug: base, conflict: Boolean(exists) };
}

/**
 * Build the `data` payload for Prisma.
 * Input comes from Zod transform (brand→brandName, sellingPrice→currentPrice,
 * stock→stockQuantity, isPublic→isActive).
 */
function buildProductData(
  input: ProductInput,
  ctx: { slug: string; shopId: number },
) {
  const stockQuantity = input.stockQuantity ?? 0;
  const brandName = input.brandName ?? "Unknown";

  return {
    name: input.name,
    brandName,
    category: input.category,
    slug: ctx.slug,
    shopId: ctx.shopId,

    regularPrice: input.regularPrice,
    currentPrice: input.currentPrice,
    buyingPrice: input.buyingPrice ?? null,
    discountPercent: Math.round(
      ((input.regularPrice - input.currentPrice) / input.regularPrice) * 100,
    ),

    stockQuantity,
    inStock: stockQuantity > 0,
    isActive: input.isActive,

    sku: input.sku ?? null,
    badge: input.badge ?? null,
    subcategory: input.subcategory ?? null,
    section: input.section ?? null,
    shortDescription: input.shortDescription ?? null,
    description: input.description ?? null,

    productType: input.productType,
    sizeOptions: input.sizeOptions ?? [],
    colorOptions: input.colorOptions ?? [],

    isFeatured: input.isFeatured ?? false,
    isFreeShipping: input.isFreeShipping ?? false,
    enableStockAlert: input.enableStockAlert ?? false,
    stockAlertQty: input.stockAlertQty ?? null,
    maxOrderQty: input.maxOrderQty ?? null,
    rank: input.rank ?? null,

    images: input.images,
    seo: input.seo ?? {},
    specifications: input.specifications ?? [],
  };
}

function variantsCreateData(input: ProductInput) {
  if (!input.variants || input.variants.length === 0) return undefined;
  return {
    create: input.variants.map((v) => ({
      size: v.size ?? null,
      color: v.color ?? null,
      sku: v.sku ?? null,
      price: v.price,
      stock: v.stock,
    })),
  };
}

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins must use /api/admin/super/products.",
    });
    return null;
  }
  return shopId;
}

/* ================================================================
   Endpoints
   ================================================================ */

export async function listProducts(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  try {
    const products = await prisma.product.findMany({
      where: { shopId },
      orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
      include: { variants: true },
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching admin products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function getProductById(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const product = await prisma.product.findFirst({
      where: { id, shopId },
      include: { variants: true },
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching admin product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createProduct(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatProductValidationErrors(parsed.error),
    });
  }

  try {
    const { slug, conflict } = await generateProductSlug(parsed.data.name);
    if (conflict) {
      return res.status(409).json({
        success: false,
        message: "A product with a similar name already exists.",
        errors: {
          name: "This name creates a URL that is already taken. Pick a different name.",
        },
      });
    }

    const product = await prisma.product.create({
      data: {
        ...buildProductData(parsed.data, { slug, shopId }),
        ...(variantsCreateData(parsed.data) && {
          variants: variantsCreateData(parsed.data),
        }),
      },
      include: { variants: true },
    });

    void logAudit({
      req,
      action: "product.create",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name, slug: product.slug },
      targetShopId: shopId,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    const handled = sendPrismaError(error, res);
    if (handled) return handled;
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateProduct(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatProductValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { id, shopId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (existing.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "This product is blocked. Contact a super admin to unblock.",
      });
    }

    // Slug and shopId are locked after create.
    const product = await prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...buildProductData(parsed.data, {
            slug: existing.slug,
            shopId: existing.shopId,
          }),
          ...(variantsCreateData(parsed.data) && {
            variants: variantsCreateData(parsed.data),
          }),
        },
        include: { variants: true },
      });
    });

    void logAudit({
      req,
      action: "product.update",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name },
      targetShopId: shopId,
    });

    return res.json({ success: true, data: product });
  } catch (error) {
    const handled = sendPrismaError(error, res);
    if (handled) return handled;
    console.error("Error updating product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteProduct(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const existing = await prisma.product.findFirst({
      where: { id, shopId },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (existing.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "This product is blocked. Contact a super admin to unblock.",
      });
    }

    await prisma.product.delete({ where: { id } });

    void logAudit({
      req,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      metadata: { name: existing.name },
      targetShopId: shopId,
    });

    return res.json({ success: true });
  } catch (error) {
    const handled = sendPrismaError(error, res);
    if (handled) return handled;
    console.error("Error deleting product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
