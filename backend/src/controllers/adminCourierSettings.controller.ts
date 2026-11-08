import type { Request, Response } from "express";
import { courierSettingsSchema } from "../schemas/courierSettings.schema.js";
import { prisma } from "../lib/prisma.js";

type Row = NonNullable<
  Awaited<ReturnType<typeof prisma.courierSettings.findUnique>>
>;

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

export async function getCourierSettings(_req: Request, res: Response) {
  try {
    let row = await prisma.courierSettings.findUnique({ where: { id: 1 } });
    // Auto-create with defaults on first read — no migration script needed.
    if (!row) {
      row = await prisma.courierSettings.create({ data: { id: 1 } });
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
  const parsed = courierSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "form";
      if (!(key in errors)) errors[key] = issue.message;
    }
    return res
      .status(422)
      .json({ success: false, message: "Validation failed", errors });
  }

  const d = parsed.data;
  try {
    const row = await prisma.courierSettings.upsert({
      where: { id: 1 },
      update: {
        enabled: d.enabled,
        flatFeeEnabled: d.flat_fee_enabled,
        insideDhakaFee: d.inside_dhaka_fee,
        subDhakaFee: d.sub_dhaka_fee,
        outsideDhakaFee: d.outside_dhaka_fee,
        freeDeliveryAbove: d.free_delivery_above,
      },
      create: {
        id: 1,
        enabled: d.enabled,
        flatFeeEnabled: d.flat_fee_enabled,
        insideDhakaFee: d.inside_dhaka_fee,
        subDhakaFee: d.sub_dhaka_fee,
        outsideDhakaFee: d.outside_dhaka_fee,
        freeDeliveryAbove: d.free_delivery_above,
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
