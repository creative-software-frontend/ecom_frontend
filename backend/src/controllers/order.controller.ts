import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";

interface OrderItemInput {
  productId: number | string;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderBody {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  notes?: string;
  deliveryArea?: string;
  deliveryCharge?: number;
  items?: OrderItemInput[];
}

export async function createOrder(req: Request, res: Response) {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      notes,
      deliveryArea,
      deliveryCharge,
      items,
    } = req.body as CreateOrderBody;

    if (
      !customerName ||
      !customerPhone ||
      !customerAddress ||
      !items ||
      items.length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing" });
    }

    const hasFractionalValues =
      !Number.isInteger(deliveryCharge || 0) ||
      items.some(
        (item) =>
          !Number.isInteger(item.unitPrice) ||
          !Number.isInteger(item.quantity),
      );

    if (hasFractionalValues) {
      return res.status(400).json({
        success: false,
        message: "Prices and quantities must be whole numbers",
      });
    }

    const productIds = Array.from(
      new Set(
        items.map((item) => parseId(item.productId)).filter((id): id is number => id !== null),
      ),
    );
    if (productIds.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: "Each item must have a valid product ID",
      });
    }

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
        isBlocked: false,
      },
      select: { id: true, shopId: true },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are unavailable",
      });
    }

    const shopIds = new Set(products.map((product) => product.shopId));
    if (shopIds.size !== 1) {
      return res.status(400).json({
        success: false,
        message: "All items in an order must belong to the same shop",
      });
    }

    const shopId = products[0]?.shopId;
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "Unable to determine shop for order",
      });
    }
    const productById = new Map(products.map((product) => [product.id, product]));

    // সাবটোটাল এবং মোট হিসাব করা
    let subtotal = 0;
    const orderItemsData = [];
    for (const item of items) {
      const productId = parseId(item.productId);
      if (productId === null || !productById.has(productId)) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid product ID",
        });
      }
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItemsData.push({
        productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: lineTotal,
      });
    }

    const total = subtotal + (deliveryCharge || 0);
    const orderNumber = `PZ-${Math.floor(100000 + Math.random() * 900000)}`;

    // ট্রানজ্যাকশনের মাধ্যমে অর্ডার এবং অর্ডার আইটেম সেভ করা
    const newOrder = await prisma.order.create({
      data: {
        shopId,
        orderNumber,
        customerName,
        customerPhone,
        customerAddress,
        notes,
        deliveryArea: deliveryArea || "Inside Dhaka",
        deliveryCharge: deliveryCharge || 0,
        subtotal,
        total,
        paymentMethod: "cod",
        paymentStatus: "unpaid",
        status: "pending",
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (error) {
    console.error("Error placing order:", error);
    return res.status(500).json({ success: false, message: "Failed to place order" });
  }
}
