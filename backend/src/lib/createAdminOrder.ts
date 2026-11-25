import type { Request } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  createAdminOrderSchema,
  formatOrderValidationErrors,
} from "../schemas/order.schema.js";
import { prisma } from "./prisma.js";

type ErrorBody = {
  success: false;
  message: string;
  errors?: Record<string, string>;
};

export type CreateAdminOrderResult =
  | { ok: true; order: { id: number; orderNumber: string; total: number; source: string | null; shopId: number } }
  | { ok: false; status: number; body: ErrorBody };

function failure(
  status: number,
  message: string,
  errors?: Record<string, string>,
): CreateAdminOrderResult {
  return {
    ok: false,
    status,
    body: {
      success: false,
      message,
      ...(errors !== undefined && { errors }),
    },
  };
}

/**
 * Shared manual-order writer for Shop Admin and Super Admin.
 * Caller resolves/authorizes `targetShopId` before invoking this function.
 */
export async function createAdminOrder(
  req: Request,
  targetShopId: number,
): Promise<CreateAdminOrderResult> {
  const parsed = createAdminOrderSchema.safeParse(req.body);
  if (!parsed.success) {
    return failure(
      422,
      "Validation failed",
      formatOrderValidationErrors(parsed.error),
    );
  }
  const data = parsed.data;

  const actor = req.user;
  if (!actor) {
    return failure(403, "Unauthorized");
  }

  // Merge duplicate product IDs before reserving stock.
  const quantities = new Map<number, number>();
  for (const item of data.items) {
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity,
    );
  }
  const items = Array.from(quantities, ([productId, quantity]) => ({
    productId,
    quantity,
  }));

  // Resolve assignee: an explicitly supplied ID must be an active member of
  // the target shop. Shop admins default to themselves; platform staff do not.
  let assignedToId: number | null = null;
  if (data.assignedToId !== undefined && data.assignedToId !== null) {
    const assignee = await prisma.user.findFirst({
      where: {
        id: data.assignedToId,
        shopId: targetShopId,
        status: "active",
      },
      select: { id: true },
    });
    if (!assignee) {
      return failure(422, "Validation failed", {
        assignedToId: "Selected assignee is not an active member of this shop.",
      });
    }
    assignedToId = assignee.id;
  } else if (data.assignedToId === undefined && actor.shopId === targetShopId) {
    assignedToId = actor.id;
  }

  const courierSettings = await prisma.courierSettings.findUnique({
    where: { id: 1 },
  });
  const fees = {
    insideDhakaFee: courierSettings?.insideDhakaFee ?? 60,
    subDhakaFee: courierSettings?.subDhakaFee ?? 100,
    outsideDhakaFee: courierSettings?.outsideDhakaFee ?? 130,
  };
  const zones: Record<
    (typeof data)["shippingZoneId"],
    { deliveryArea: string; deliveryCharge: number }
  > = {
    "inside-dhaka": {
      deliveryArea: "Inside Dhaka",
      deliveryCharge: fees.insideDhakaFee,
    },
    "sub-dhaka": {
      deliveryArea: "Sub-Dhaka",
      deliveryCharge: fees.subDhakaFee,
    },
    "outside-dhaka": {
      deliveryArea: "Outside Dhaka",
      deliveryCharge: fees.outsideDhakaFee,
    },
    free: { deliveryArea: "Free Delivery", deliveryCharge: 0 },
  };
  const { deliveryArea, deliveryCharge } = zones[data.shippingZoneId];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: {
          id: { in: productIds },
          shopId: targetShopId,
          isActive: true,
          isBlocked: false,
        },
        select: { id: true, name: true, currentPrice: true, stockQuantity: true },
      });

      if (products.length !== productIds.length) {
        return failure(422, "Validation failed", {
          items: "One or more selected products are unavailable for this shop.",
        });
      }
      const productById = new Map(products.map((product) => [product.id, product]));

      const pricedItems = items.map((item) => {
        const product = productById.get(item.productId)!;
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.currentPrice,
          lineTotal: product.currentPrice * item.quantity,
          name: product.name,
        };
      });

      const subtotal = pricedItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );
      if (data.discount > subtotal + deliveryCharge) {
        return failure(422, "Validation failed", {
          discount: "Discount cannot exceed subtotal plus shipping fee.",
        });
      }
      const total = subtotal + deliveryCharge - data.discount;
      if (data.advance > total) {
        return failure(422, "Validation failed", {
          advance: "Advance payment cannot exceed order total.",
        });
      }
      const paymentStatus = total === 0 || data.advance >= total ? "paid" : "unpaid";

      // Atomic conditional decrement — nothing is reserved without stock.
      for (const item of pricedItems) {
        const decremented = await tx.product.updateMany({
          where: {
            id: item.productId,
            shopId: targetShopId,
            isActive: true,
            isBlocked: false,
            stockQuantity: { gte: item.quantity },
          },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        if (decremented.count === 0) {
          const product = productById.get(item.productId)!;
          const message = `Insufficient stock for ${product.name}. Only ${product.stockQuantity} available.`;
          return failure(422, message, { items: message });
        }
      }

      await tx.product.updateMany({
        where: {
          id: { in: productIds },
          shopId: targetShopId,
          stockQuantity: 0,
          inStock: true,
        },
        data: { inStock: false },
      });

      const orderNumber = await generateOrderNumber(tx);
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerAddress: data.customerAddress,
          notes: data.adminNote ?? null,
          deliveryArea,
          deliveryCharge,
          subtotal,
          discount: data.discount,
          advance: data.advance,
          total,
          paymentMethod: "cod",
          paymentStatus,
          status: "pending",
          source: data.source,
          courier: data.courier ?? null,
          courierNote: data.courierNote ?? null,
          assignedToId,
          shopId: targetShopId,
          items: {
            create: pricedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
            })),
          },
        },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          source: true,
          shopId: true,
        },
      });

      return { ok: true as const, order: created };
    });

    return result;
  } catch (error) {
    console.error("createAdminOrder failed:", error);
    return failure(500, "Internal server error");
  }
}

async function generateOrderNumber(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = `PZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await tx.order.findUnique({
      where: { orderNumber: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Unable to generate a unique order number");
}
