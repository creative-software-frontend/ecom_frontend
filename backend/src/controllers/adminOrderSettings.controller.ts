import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { orderSettingsSchema } from "../schemas/orderSettings.schema.js";

type OrderSettingsRow = NonNullable<
  Awaited<ReturnType<typeof prisma.orderSettings.findUnique>>
>;

function toApiShape(row: OrderSettingsRow) {
  return {
    duplicate_block: {
      enabled: row.duplicateBlockEnabled,
      minutes: row.duplicateBlockMinutes,
    },
    location_fields: {
      enabled: row.locationFieldsEnabled,
    },
    delivery_charges: {
      inside_dhaka: row.deliveryInsideDhaka,
      outside_dhaka: row.deliveryOutsideDhaka,
      free_delivery_above: row.freeDeliveryAbove,
    },
    mobile_verification: { enabled: row.mobileVerificationEnabled },
    sms_confirmation: { enabled: row.smsConfirmationEnabled },
    vpn_protection: { enabled: row.vpnProtectionEnabled },
    courier_protection: {
      enabled: row.courierProtectionEnabled,
      min_success_ratio: row.courierMinSuccessRatio,
    },
  };
}

export async function getOrderSettings(_req: Request, res: Response) {
  try {
    const row = await prisma.orderSettings.findUnique({ where: { id: 1 } });
    if (!row) {
      return res.status(404).json({
        success: false,
        message: "Order settings not initialized. Run the migration script.",
      });
    }
    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error fetching order settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

export async function updateOrderSettings(req: Request, res: Response) {
  const parsed = orderSettingsSchema.safeParse(req.body);
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
    // Beta features only override DB defaults when explicitly sent.
    // This keeps API backward-compatible if UI later drops them from payload.
    const betaUpdate = {
      ...(d.mobile_verification !== undefined && {
        mobileVerificationEnabled: d.mobile_verification.enabled,
      }),
      ...(d.sms_confirmation !== undefined && {
        smsConfirmationEnabled: d.sms_confirmation.enabled,
      }),
      ...(d.vpn_protection !== undefined && {
        vpnProtectionEnabled: d.vpn_protection.enabled,
      }),
      ...(d.courier_protection !== undefined && {
        courierProtectionEnabled: d.courier_protection.enabled,
        courierMinSuccessRatio: d.courier_protection.min_success_ratio,
      }),
    };

    const row = await prisma.orderSettings.upsert({
      where: { id: 1 },
      update: {
        duplicateBlockEnabled: d.duplicate_block.enabled,
        duplicateBlockMinutes: d.duplicate_block.minutes,
        locationFieldsEnabled: d.location_fields.enabled,
        deliveryInsideDhaka: d.delivery_charges.inside_dhaka,
        deliveryOutsideDhaka: d.delivery_charges.outside_dhaka,
        freeDeliveryAbove: d.delivery_charges.free_delivery_above,
        ...betaUpdate,
      },
      create: {
        id: 1,
        duplicateBlockEnabled: d.duplicate_block.enabled,
        duplicateBlockMinutes: d.duplicate_block.minutes,
        locationFieldsEnabled: d.location_fields.enabled,
        deliveryInsideDhaka: d.delivery_charges.inside_dhaka,
        deliveryOutsideDhaka: d.delivery_charges.outside_dhaka,
        freeDeliveryAbove: d.delivery_charges.free_delivery_above,
        // Beta fields not provided -> DB defaults (false, 65)
      },
    });
    return res.json({ success: true, data: toApiShape(row) });
  } catch (error) {
    console.error("Error updating order settings:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
