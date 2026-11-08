import { z } from "zod";

export const orderSettingsSchema = z.object({
  duplicate_block: z.object({
    enabled: z.boolean(),
    minutes: z
      .number({ error: "Enter a valid number" })
      .int("Must be a whole number")
      .min(1, "Minimum 1 minute")
      .max(1440, "Maximum 1440 minutes (24h)"),
  }),
  location_fields: z.object({
    enabled: z.boolean(),
  }),
  delivery_charges: z.object({
    inside_dhaka: z
      .number({ error: "Enter a valid amount" })
      .int()
      .min(0)
      .max(100_000),
    outside_dhaka: z
      .number({ error: "Enter a valid amount" })
      .int()
      .min(0)
      .max(100_000),
    free_delivery_above: z
      .number({ error: "Enter a valid amount" })
      .int()
      .min(0)
      .max(1_000_000),
  }),
  // Beta features — optional in payload; UI sends them disabled (all false, 65).
  // Accepting them now means enabling later requires zero backend changes.
  mobile_verification: z.object({ enabled: z.boolean() }).optional(),
  sms_confirmation: z.object({ enabled: z.boolean() }).optional(),
  vpn_protection: z.object({ enabled: z.boolean() }).optional(),
  courier_protection: z
    .object({
      enabled: z.boolean(),
      min_success_ratio: z.number().int().min(0).max(100),
    })
    .optional(),
});

export type OrderSettingsInput = z.infer<typeof orderSettingsSchema>;
