import type { Request, Response } from "express";
import type { Prisma } from "../../generated/prisma/client.js";
import {
  canTransitionOrderStatus,
  canUpdatePaymentStatus,
  type OrderStatus,
} from "../constants/order.js";
import { logAudit } from "../lib/auditLog.js";
import { prisma } from "../lib/prisma.js";
import { parseId } from "../lib/parseId.js";
import {
  formatOrderValidationErrors,
  getRequestedOrderStatus,
  orderListQuerySchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";

function getDhakaDayStart(date: string, dayOffset = 0): Date {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));
  return new Date(
    Date.UTC(year, month - 1, day + dayOffset) - 6 * 60 * 60 * 1000,
  );
}

function parseOptionalShopId(value: unknown): number | null | undefined {
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (typeof value === "string" && !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function fetchOrderDetail(id: number) {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      shop: { select: { id: true, name: true, slug: true } },
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

  if (!order) return null;

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
    shopId: order.shopId,
    shop: order.shop,
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

export async function superListOrders(req: Request, res: Response) {
  const parsed = orderListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatOrderValidationErrors(parsed.error),
    });
  }

  const shopId = parseOptionalShopId(req.query.shopId);
  if (shopId === null) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: { shopId: "shopId must be a positive integer" },
    });
  }

  const { page, limit, status, paymentStatus, area, dateFrom, dateTo, q } =
    parsed.data;
  const where: Prisma.OrderWhereInput = {};

  if (shopId !== undefined) where.shopId = shopId;
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (area) where.deliveryArea = area;
  if (dateFrom || dateTo) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (dateFrom) dateFilter.gte = getDhakaDayStart(dateFrom);
    if (dateTo) dateFilter.lt = getDhakaDayStart(dateTo, 1);
    where.createdAt = dateFilter;
  }
  // order search
  const trimmedQ = q?.trim();
  if (trimmedQ) {
    where.OR = [
      { orderNumber: { contains: trimmedQ } },
      { customerName: { contains: trimmedQ } },
      { customerPhone: { contains: trimmedQ } },
    ];
  }
  // pagination
  const skip = (page - 1) * limit;
  const take = limit;

  try {
    const [orders, total, statusGroups, areaGroups] = await prisma.$transaction(
      [
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
            customerAddress: true,
            total: true,
            status: true,
            paymentStatus: true,
            paymentMethod: true,
            shopId: true,
            createdAt: true,
            shop: { select: { id: true, name: true, slug: true } },
            _count: { select: { items: true } },
          },
        }),
        prisma.order.count({ where }),
        prisma.order.groupBy({
          by: ["status"],
          where,
          _count: { _all: true },
          _sum: { total: true },
        }),
        prisma.order.findMany({
          where: shopId !== undefined ? { shopId } : {},
          distinct: ["deliveryArea"],
          select: { deliveryArea: true },
          orderBy: { deliveryArea: "asc" },
        }),
      ],
    );

    const counts: Record<
      OrderStatus | "all",
      { count: number; totalPrice: number }
    > = {
      all: { count: 0, totalPrice: 0 },
      pending: { count: 0, totalPrice: 0 },
      confirmed: { count: 0, totalPrice: 0 },
      shipped: { count: 0, totalPrice: 0 },
      delivered: { count: 0, totalPrice: 0 },
      cancelled: { count: 0, totalPrice: 0 },
      returned: { count: 0, totalPrice: 0 },
    };

    for (const group of statusGroups) {
      const count = group._count._all;
      const statusKey = group.status as OrderStatus;
      if (statusKey in counts) {
        counts[statusKey] = { count, totalPrice: group._sum.total || 0 };
      }
      counts.all.count += count;
      counts.all.totalPrice += group._sum.total || 0;
    }

    return res.status(200).json({
      success: true,
      data: {
        items: orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          deliveryArea: o.deliveryArea,
          customerAddress: o.customerAddress,
          total: o.total,
          orderStatus: o.status,
          status: o.status,
          paymentStatus: o.paymentStatus,
          paymentMethod: o.paymentMethod,
          shopId: o.shopId,
          shop: o.shop,
          createdAt: o.createdAt,
          itemCount: o._count.items,
        })),
        page,
        limit,
        total,
        areas: areaGroups.map(({ deliveryArea }) => deliveryArea),
        counts,
      },
    });
  } catch (error) {
    console.error("Error fetching super admin orders list:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superGetOrderById(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
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
    console.error("Error fetching super admin order detail:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function superUpdateOrderStatus(req: Request, res: Response) {
  const id = parseId(req.params.id);
  if (id === null) {
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

  const { paymentStatus } = parsed.data;
  const orderStatus = getRequestedOrderStatus(parsed.data);

  try {
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, paymentStatus: true, shopId: true },
    });

    if (!currentOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (
      orderStatus !== undefined &&
      !canTransitionOrderStatus(currentOrder.status, orderStatus)
    ) {
      const message = `Cannot change order status from ${currentOrder.status} to ${orderStatus}`;
      return res.status(422).json({
        success: false,
        message,
        errors: { orderStatus: message },
      });
    }

    if (
      paymentStatus !== undefined &&
      !canUpdatePaymentStatus(currentOrder.status, orderStatus)
    ) {
      return res.status(422).json({
        success: false,
        message: "Cannot change payment status of a cancelled order",
        errors: {
          paymentStatus: "Cannot change payment status of a cancelled order",
        },
      });
    }

    const updateData: Prisma.OrderUpdateInput = {};
    if (orderStatus !== undefined) updateData.status = orderStatus;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;

    const updateResult = await prisma.order.updateMany({
      where: { id, status: currentOrder.status },
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
      if (
        orderStatus !== undefined &&
        !canTransitionOrderStatus(recheck.status, orderStatus)
      ) {
        const message = `Cannot change order status from ${recheck.status} to ${orderStatus}`;
        return res.status(422).json({
          success: false,
          message,
          errors: { orderStatus: message },
        });
      }
      if (
        paymentStatus !== undefined &&
        !canUpdatePaymentStatus(recheck.status)
      ) {
        return res.status(422).json({
          success: false,
          message: "Cannot change payment status of a cancelled order",
          errors: {
            paymentStatus: "Cannot change payment status of a cancelled order",
          },
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

    void logAudit({
      req,
      action: "order.status_update",
      entityType: "order",
      entityId: currentOrder.id,
      metadata: {
        previousStatus: currentOrder.status,
        previousPaymentStatus: currentOrder.paymentStatus,
        ...(orderStatus !== undefined && { status: orderStatus }),
        ...(paymentStatus !== undefined && { paymentStatus }),
      },
      targetShopId: currentOrder.shopId,
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating super admin order status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
