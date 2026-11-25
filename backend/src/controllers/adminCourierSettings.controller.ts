import type { Request, Response } from "express";
import { logAudit } from "../lib/auditLog.js";
import { prisma } from "../lib/prisma.js";
import { sendValidationError } from "../lib/validation.js";
import { courierSettingsSchema } from "../schemas/courierSettings.schema.js";

type Row = NonNullable<
  Awaited<ReturnType<typeof prisma.courierSettings.findUnique>>
>;

function getShopIdOrForbid(req: Request, res: Response): number | null {
  const shopId = req.user?.shopId;
  if (!shopId) {
    res.status(403).json({
      success: false,
      message:
        "Shop-scoped endpoint. Super admins cannot manage shop courier settings here.",
    });
    return null;
  }
  return shopId;
}

function toApiShape(row: Row) {
  return {
    enabled: row.enabled,
    flat_fee_enabled: row.flatFeeEnabled,
    inside_dhaka_fee: row.insideDhakaFee,
    sub_dhaka_fee: row.subDhakaFee,
    outside_dhaka_fee: row.outsideDhakaFee,
    free_delivery_above: row.freeDeliveryAbove,
  };
}

export async function getCourierSettings(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  try {
    let row = await prisma.courierSettings.findUnique({ where: { shopId } });
    // Auto-create with defaults on first read — no migration script needed.
    if (!row) {
      row = await prisma.courierSettings.create({ data: { shopId } });
    }
    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error fetching courier settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateCourierSettings(req: Request, res: Response) {
  const shopId = getShopIdOrForbid(req, res);
  if (shopId === null) return;

  const parsed = courierSettingsSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const d = parsed.data;
  try {
    const values = {
      enabled: d.enabled,
      flatFeeEnabled: d.flat_fee_enabled,
      insideDhakaFee: d.inside_dhaka_fee,
      subDhakaFee: d.sub_dhaka_fee,
      outsideDhakaFee: d.outside_dhaka_fee,
      freeDeliveryAbove: d.free_delivery_above,
    };
    const row = await prisma.courierSettings.upsert({
      where: { shopId },
      update: values,
      create: { shopId, ...values },
    });

    void logAudit({
      req,
      action: "courier.settings_update",
      entityType: "courier_settings",
      entityId: row.id,
      targetShopId: shopId,
      metadata: {
        enabled: row.enabled,
        flatFeeEnabled: row.flatFeeEnabled,
        insideDhakaFee: row.insideDhakaFee,
        subDhakaFee: row.subDhakaFee,
        outsideDhakaFee: row.outsideDhakaFee,
        freeDeliveryAbove: row.freeDeliveryAbove,
      },
    });

    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error updating courier settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
