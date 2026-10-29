import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getProducts(_req: Request, res: Response) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
}

export async function getProductBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    if (!slug || typeof slug !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product slug" });
    }

    const product = await prisma.product.findUnique({
      where: { slug },
      include: { reviews: true },
    });

    if (!product || !product.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch product" });
  }
}
