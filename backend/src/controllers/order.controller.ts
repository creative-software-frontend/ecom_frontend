import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

interface OrderItemInput {
  productId: string;
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

    // সাবটোটাল এবং মোট হিসাব করা
    let subtotal = 0;
    const orderItemsData = items.map((item) => {
      const lineTotal = item.unitPrice * item.quantity;
      subtotal += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: lineTotal,
      };
    });

    const total = subtotal + (deliveryCharge || 0);
    const orderNumber = `PZ-${Math.floor(100000 + Math.random() * 900000)}`;

    // ট্রানজ্যাকশনের মাধ্যমে অর্ডার এবং অর্ডার আইটেম সেভ করা
    const newOrder = await prisma.order.create({
      data: {
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
