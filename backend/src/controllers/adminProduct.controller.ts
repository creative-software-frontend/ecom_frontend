import type { Request, Response } from "express";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import {
  formatProductValidationErrors,
  productInputSchema,
  type ProductInput,
} from "../schemas/product.schema.js";

function buildProductData(input: ProductInput) {
  return {
    name: input.name,
    brandName: input.brandName,
    category: input.category,
    slug: input.slug,
    regularPrice: input.regularPrice,
    currentPrice: input.currentPrice,
    stockQuantity: input.stockQuantity,
    images: input.images,
    isActive: input.isActive ?? true,
    discountPercent: Math.round(
      ((input.regularPrice - input.currentPrice) / input.regularPrice) * 100,
    ),
    inStock: input.stockQuantity > 0,
  };
}

export async function listProducts(_req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
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
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    const product = await prisma.product.findUnique({ where: { id } });

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
  const parsed = productInputSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatProductValidationErrors(parsed.error),
    });
  }

  try {
    const product = await prisma.product.create({
      data: buildProductData(parsed.data),
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
  const { id } = req.params;

  if (!id || typeof id !== "string") {
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
    const product = await prisma.product.update({
      where: { id },
      data: buildProductData(parsed.data),
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
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res
      .status(404)
      .json({ success: false, message: "Product not found" });
  }

  try {
    await prisma.product.delete({ where: { id } });

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
