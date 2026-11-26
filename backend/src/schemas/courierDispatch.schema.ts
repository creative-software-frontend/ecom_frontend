import { z } from "zod";
import type { CourierSlug } from "./courierAccount.schema.js";

const positiveId = z.coerce
  .number({ error: "Enter a valid ID" })
  .int("Must be a whole number")
  .positive("Must be positive");

const optionalWeight = z
  .number({ error: "Enter a valid weight" })
  .min(0.1, "Weight must be at least 0.1 kg")
  .max(50, "Weight cannot exceed 50 kg")
  .optional();

const optionalNote = z.string().trim().max(500, "Note is too long").optional();

export const dispatchOrderSchema = z
  .object({
    courierSlug: z.enum(["steadfast", "pathao", "redx", "carrybee"]),
    cityId: positiveId.optional(),
    zoneId: positiveId.optional(),
    areaId: positiveId.optional(),
    areaName: z.string().trim().min(1).max(150).optional(),
    itemWeight: optionalWeight,
    note: optionalNote,
    confirmFirst: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    const require = (field: keyof typeof value, message: string) => {
      if (value[field] === undefined || value[field] === "") {
        context.addIssue({
          code: "custom",
          path: [field],
          message,
        });
      }
    };
    if (value.courierSlug === "pathao") {
      require("cityId", "City is required for Pathao.");
      require("zoneId", "Zone is required for Pathao.");
    }
    if (value.courierSlug === "redx") {
      require("areaId", "Delivery area is required for RedX.");
      require("areaName", "Delivery area name is required for RedX.");
    }
    if (value.courierSlug === "carrybee") {
      require("cityId", "City is required for Carrybee.");
      require("zoneId", "Zone is required for Carrybee.");
      require("areaId", "Area is required for Carrybee.");
    }
  });

export type DispatchOrderInput = z.infer<typeof dispatchOrderSchema>;
export type DispatchCourierSlug = CourierSlug;

export const bulkDispatchSchema = z.object({
  orderIds: z
    .array(z.number({ error: "Enter a valid order ID" }).int().positive())
    .min(1, "Select at least one order")
    .max(50, "Select up to 50 orders at a time"),
  courierSlug: z.literal("steadfast"),
  confirmFirst: z.boolean().default(false),
});

export type BulkDispatchInput = z.infer<typeof bulkDispatchSchema>;

export const courierZonesQuerySchema = z.object({
  cityId: positiveId,
});

export const courierAreasQuerySchema = z.object({
  cityId: positiveId.optional(),
  zoneId: positiveId.optional(),
});
