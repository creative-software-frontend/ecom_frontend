import { z } from "zod"

export const orderSettingsSchema = z.object({
  duplicate_block: z.object({
    enabled: z.boolean(),
    // 1–1440 minutes (24h). Prevents accidental 0 or huge values.
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
      .max(100000),
    outside_dhaka: z
      .number({ error: "Enter a valid amount" })
      .int()
      .min(0)
      .max(100000),
    free_delivery_above: z
      .number({ error: "Enter a valid amount" })
      .int()
      .min(0)
      .max(1000000),
  }),
  // Beta features — schema accepts but UI is read-only
  mobile_verification: z.object({ enabled: z.boolean() }),
  sms_confirmation: z.object({ enabled: z.boolean() }),
  vpn_protection: z.object({ enabled: z.boolean() }),
  courier_protection: z.object({
    enabled: z.boolean(),
    min_success_ratio: z.number().int().min(0).max(100),
  }),
})

export type OrderSettingsFormValues = z.infer<typeof orderSettingsSchema>
