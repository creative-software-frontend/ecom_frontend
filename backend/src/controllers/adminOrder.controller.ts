import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  ALLOWED_ORDER_STATUS_TRANSITIONS,
  type OrderStatus,
} from "../constants/order.js";
import { prisma } from "../lib/prisma.js";
import {
  formatOrderValidationErrors,
  orderListQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";

// get order details by id
async function fetchOrderDetail(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    customerAddress: order.customerAddress,
    notes: order.notes,
    deliveryArea: order.deliveryArea,
    deliveryCharge: order.deliveryCharge,
    subtotal: order.subtotal,
    total: order.total,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    orderStatus: order.status,
    createdAt: order.createdAt,
    items: order.items.map((item) => {
      let image: string | null = null;
      if (
        Array.isArray(item.product?.images) &&
        typeof item.product.images[0] === "string"
      ) {
        image = item.product.images[0];
      }
      return {
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        product: {
          name: item.product.name,
          slug: item.product.slug,
          image,
        },
      };
    }),
  };
}

export async function listOrders(req: Request, res: Response) {
  const parsed = orderListQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatOrderValidationErrors(parsed.error),
    });
  }

  const { page, limit, status, q } = parsed.data;

  const where: Prisma.OrderWhereInput = {};

  if (status) {
    where.status = status;
  }

  const trimmedQ = q?.trim();
  if (trimmedQ) {
    where.OR = [
      { orderNumber: { contains: trimmedQ } },
      { customerName: { contains: trimmedQ } },
      { customerPhone: { contains: trimmedQ } },
    ];
  }

  const skip = (page - 1) * limit;
  const take = limit;

  try {
    const [orders, total, statusGroups] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
          deliveryArea: true,
          total: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          createdAt: true,
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ["status"],
        _count: {
          _all: true,
        },
      }),
    ]);

    const counts: Record<OrderStatus | "all", number> = {
      all: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const group of statusGroups) {
      const count = group._count._all;
      const statusKey = group.status as OrderStatus;
      if (statusKey in counts) {
        counts[statusKey] = count;
      }
      counts.all += count;
    }

    const items = orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      deliveryArea: o.deliveryArea,
      total: o.total,
      orderStatus: o.status,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      createdAt: o.createdAt,
      itemCount: o._count.items,
    }));

    return res.status(200).json({
      success: true,
      data: {
        items,
        page,
        limit,
        total,
        counts,
      },
    });
  } catch (error) {
    console.error("Error fetching admin orders list:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function getOrderById(req: Request, res: Response) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  try {
    const order = await fetchOrderDetail(id);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching admin order detail:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  const parsed = updateOrderStatusSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatOrderValidationErrors(parsed.error),
    });
  }

  const { orderStatus, paymentStatus } = parsed.data;

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paymentStatus: true },
    });

    if (!currentOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (orderStatus !== undefined) {
      const currentStatus = currentOrder.status as OrderStatus;
      const allowedTransitions =
        ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus];

      if (!allowedTransitions || !allowedTransitions.includes(orderStatus)) {
        return res.status(409).json({
          success: false,
          message: `Cannot change order status from ${currentOrder.status} to ${orderStatus}`,
        });
      }
    }

    if (paymentStatus !== undefined) {
      if (currentOrder.status === "cancelled" || orderStatus === "cancelled") {
        return res.status(409).json({
          success: false,
          message: "Cannot change payment status of a cancelled order",
        });
      }
    }

    const updateData: Prisma.OrderUpdateInput = {};
    if (orderStatus !== undefined) {
      updateData.status = orderStatus;
    }
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }

    const updateResult = await prisma.order.updateMany({
      where: {
        id,
        status: currentOrder.status,
      },
      data: updateData,
    });

    if (updateResult.count === 0) {
      const recheck = await prisma.order.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!recheck) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      if (orderStatus !== undefined) {
        return res.status(409).json({
          success: false,
          message: `Cannot change order status from ${recheck.status} to ${orderStatus}`,
        });
      }

      if (paymentStatus !== undefined && recheck.status === "cancelled") {
        return res.status(409).json({
          success: false,
          message: "Cannot change payment status of a cancelled order",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Conflict updating order status",
      });
    }

    const updated = await fetchOrderDetail(id);

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
