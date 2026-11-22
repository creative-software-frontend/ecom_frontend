import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import { logAudit } from "../lib/auditLog.js";
import {
  formatProductValidationErrors,
  productInputSchema,
  type ProductInput,
} from "../schemas/product.schema.js";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

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

const shopInclude = {
  variants: true,
  shop: { select: { id: true, name: true, slug: true } },
} as const;

/* ================================================================
   Endpoints
   ================================================================ */

export async function superListProducts(req: Request, res: Response) {
  const shopIdRaw = req.query.shopId;
  const shopId =
    typeof shopIdRaw === "string" && /^\d+$/.test(shopIdRaw)
      ? Number(shopIdRaw)
      : undefined;

  const search =
    typeof req.query.q === "string" ? req.query.q.trim() : undefined;
  const statusRaw =
    typeof req.query.status === "string" ? req.query.status : "";
  const category =
    typeof req.query.category === "string" ? req.query.category : undefined;

  const where: Prisma.ProductWhereInput = {};
  if (shopId) where.shopId = shopId;
  if (category && category !== "all") where.category = category;
  if (statusRaw === "active") {
    where.isActive = true;
    where.isBlocked = false;
  } else if (statusRaw === "inactive") {
    where.isActive = false;
    where.isBlocked = false;
  } else if (statusRaw === "blocked") {
    where.isBlocked = true;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brandName: { contains: search } },
      { slug: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  try {
    const products = await prisma.product.findMany({
      where,
      orderBy: [{ salesCount: "desc" }, { createdAt: "desc" }],
      include: shopInclude,
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching super admin products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superGetProductById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: shopInclude,
    });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superCreateProduct(req: Request, res: Response) {
  const parsed = productInputSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatProductValidationErrors(parsed.error),
    });
  }

  if (!parsed.data.shopId) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: { shopId: "Select a shop before creating a product." },
    });
  }

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: parsed.data.shopId },
      select: { id: true },
    });
    if (!shop) {
      return res.status(422).json({
        success: false,
        message: "Validation failed",
        errors: { shopId: "Shop not found." },
      });
    }

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
        ...buildProductData(parsed.data, {
          slug,
          shopId: parsed.data.shopId,
        }),
        ...(variantsCreateData(parsed.data) && {
          variants: variantsCreateData(parsed.data),
        }),
      },
      include: shopInclude,
    });

    void logAudit({
      req,
      action: "product.create",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name, shopId: product.shopId },
      targetShopId: product.shopId,
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

export async function superUpdateProduct(req: Request, res: Response) {
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
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (existing.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Unblock this product before editing.",
      });
    }

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
        include: shopInclude,
      });
    });

    void logAudit({
      req,
      action: "product.update",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name },
      targetShopId: product.shopId,
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

export async function superDeleteProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (existing.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Unblock this product before deleting.",
      });
    }

    await prisma.product.delete({ where: { id } });

    void logAudit({
      req,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      metadata: { name: existing.name },
      targetShopId: existing.shopId,
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

export async function blockProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (existing.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "Product is already blocked." });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isBlocked: true },
      include: shopInclude,
    });

    void logAudit({
      req,
      action: "product.block",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name },
      targetShopId: product.shopId,
    });

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error blocking product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function unblockProduct(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (!existing.isBlocked) {
      return res
        .status(400)
        .json({ success: false, message: "Product is not blocked." });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { isBlocked: false },
      include: shopInclude,
    });

    void logAudit({
      req,
      action: "product.unblock",
      entityType: "product",
      entityId: product.id,
      metadata: { name: product.name },
      targetShopId: product.shopId,
    });

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error unblocking product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
