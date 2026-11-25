import type { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { logAudit } from "../lib/auditLog.js";
import { parseId } from "../lib/parseId.js";
import { sendPrismaError } from "../lib/prismaError.js";
import { prisma } from "../lib/prisma.js";
import {
  couponListQuerySchema,
  createCouponSchema,
  formatCouponValidationErrors,
  updateCouponSchema,
  updateCouponStatusSchema,
} from "../schemas/coupon.schema.js";

/* ================================================================
   Helpers
   ================================================================ */

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins cannot manage shop coupons here.",
    });
    return null;
  }
  return shopId;
}

/** Expire active coupons whose Dhaka end-of-day has passed. */
async function syncExpiredCoupons(shopId: number): Promise<void> {
  await prisma.coupon.updateMany({
    where: { shopId, status: "active", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });
}

function handleCouponPrismaError(
  error: unknown,
  res: Response,
): Response | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const message = "A coupon with this code already exists.";
    return res.status(409).json({
      success: false,
      message,
      errors: { code: message },
    });
  }
  return sendPrismaError(error, res);
}

/* ================================================================
   Endpoints
   ================================================================ */

export async function listCoupons(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = couponListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCouponValidationErrors(parsed.error),
    });
  }

  const { q, status } = parsed.data;
  const where: Prisma.CouponWhereInput = {
    shopId,
    ...(status ? { status } : {}),
    ...(q
      ? { OR: [{ code: { contains: q } }, { note: { contains: q } }] }
      : {}),
  };

  try {
    await syncExpiredCoupons(shopId);

    // Counts are shop-wide and intentionally ignore q/status filters so the
    // metric cards and tab badge stay accurate while searching.
    const [items, statusGroups] = await Promise.all([
      prisma.coupon.findMany({ where, orderBy: { createdAt: "desc" } }),
      prisma.coupon.groupBy({
        by: ["status"],
        where: { shopId },
        _count: { _all: true },
      }),
    ]);

    const counts = { total: 0, active: 0, paused: 0, expired: 0 };
    for (const group of statusGroups) {
      const count = group._count._all;
      counts.total += count;
      if (
        group.status === "active" ||
        group.status === "paused" ||
        group.status === "expired"
      ) {
        counts[group.status] = count;
      }
    }

    return res
      .status(200)
      .json({ success: true, data: { items, counts } });
  } catch (error) {
    console.error("Error fetching admin coupons:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function getCouponById(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  try {
    await syncExpiredCoupons(shopId);
    const coupon = await prisma.coupon.findFirst({ where: { id, shopId } });
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    return res.status(200).json({ success: true, data: coupon });
  } catch (error) {
    console.error("Error fetching admin coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function createCoupon(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = createCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCouponValidationErrors(parsed.error),
    });
  }

  const input = parsed.data;
  if (input.expiresAt && input.expiresAt <= new Date()) {
    const message = "Expiry date must be in the future";
    return res
      .status(422)
      .json({ success: false, message, errors: { expiresAt: message } });
  }

  try {
    const created = await prisma.coupon.create({
      data: {
        shopId,
        code: input.code,
        discountType: input.discountType,
        discountValue: input.discountValue,
        note: input.note ?? null,
        usageLimit: input.usageLimit ?? null,
        maxDiscountValue: input.maxDiscountValue ?? null,
        minPurchaseValue: input.minPurchaseValue ?? null,
        expiresAt: input.expiresAt ?? null,
        status: input.status,
      },
    });

    void logAudit({
      req,
      action: "coupon.create",
      entityType: "coupon",
      entityId: created.id,
      targetShopId: shopId,
      metadata: { code: created.code },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    const handled = handleCouponPrismaError(error, res);
    if (handled) return handled;
    console.error("Error creating coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateCoupon(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  const parsed = updateCouponSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCouponValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.coupon.findFirst({
      where: { id, shopId },
      select: {
        id: true,
        code: true,
        status: true,
        used: true,
        expiresAt: true,
      },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    const input = parsed.data;
    if (
      input.usageLimit !== undefined &&
      input.usageLimit !== null &&
      input.usageLimit < existing.used
    ) {
      const message = "Usage limit cannot be less than times already used";
      return res
        .status(422)
        .json({ success: false, message, errors: { usageLimit: message } });
    }

    const expiresAt =
      input.expiresAt === undefined ? existing.expiresAt : input.expiresAt;
    const expiryInPast = expiresAt !== null && expiresAt <= new Date();

    let nextStatus: string = input.status ?? existing.status;
    if (nextStatus === "active" && expiryInPast) {
      const message = "Expiry date must be in the future to keep coupon active";
      return res
        .status(422)
        .json({ success: false, message, errors: { expiresAt: message } });
    }
    // Extending (or clearing) the expiry of an expired coupon revives it,
    // unless the editor explicitly kept it paused.
    if (
      existing.status === "expired" &&
      input.status === undefined &&
      !expiryInPast
    ) {
      nextStatus = "active";
    }

    const data: Prisma.CouponUncheckedUpdateInput = {
      ...(input.code !== undefined && { code: input.code }),
      ...(input.discountType !== undefined && {
        discountType: input.discountType,
      }),
      ...(input.discountValue !== undefined && {
        discountValue: input.discountValue,
      }),
      ...(input.note !== undefined && { note: input.note }),
      ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
      ...(input.maxDiscountValue !== undefined && {
        maxDiscountValue: input.maxDiscountValue,
      }),
      ...(input.minPurchaseValue !== undefined && {
        minPurchaseValue: input.minPurchaseValue,
      }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt }),
      status: nextStatus,
    };

    const result = await prisma.coupon.updateMany({
      where: { id, shopId },
      data,
    });
    if (result.count === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    const updated = await prisma.coupon.findFirst({ where: { id, shopId } });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    void logAudit({
      req,
      action: "coupon.update",
      entityType: "coupon",
      entityId: id,
      targetShopId: shopId,
      metadata: { code: updated.code, previousStatus: existing.status },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    const handled = handleCouponPrismaError(error, res);
    if (handled) return handled;
    console.error("Error updating coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateCouponStatus(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  const parsed = updateCouponStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: formatCouponValidationErrors(parsed.error),
    });
  }

  try {
    const existing = await prisma.coupon.findFirst({
      where: { id, shopId },
      select: { id: true, status: true, expiresAt: true },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    const { status } = parsed.data;
    if (
      status === "active" &&
      existing.expiresAt &&
      existing.expiresAt <= new Date()
    ) {
      const message = "Cannot activate an expired coupon. Update the expiry date first.";
      return res.status(422).json({
        success: false,
        message,
        errors: { status: message },
      });
    }

    const result = await prisma.coupon.updateMany({
      where: { id, shopId },
      data: { status },
    });
    if (result.count === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    const updated = await prisma.coupon.findFirst({ where: { id, shopId } });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    void logAudit({
      req,
      action: "coupon.status_update",
      entityType: "coupon",
      entityId: id,
      targetShopId: shopId,
      metadata: { previousStatus: existing.status, status },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating coupon status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function deleteCoupon(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const id = parseId(req.params.id);
  if (id === null) {
    return res.status(404).json({ success: false, message: "Coupon not found" });
  }

  try {
    const existing = await prisma.coupon.findFirst({
      where: { id, shopId },
      select: { id: true, code: true, used: true },
    });
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (existing.used > 0) {
      return res.status(409).json({
        success: false,
        message: "This coupon has been used and cannot be deleted. Pause it instead.",
      });
    }

    // Ownership was verified by the scoped findFirst above.
    await prisma.coupon.delete({ where: { id } });

    void logAudit({
      req,
      action: "coupon.delete",
      entityType: "coupon",
      entityId: id,
      targetShopId: shopId,
      metadata: { code: existing.code },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    const handled = handleCouponPrismaError(error, res);
    if (handled) return handled;
    console.error("Error deleting coupon:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
