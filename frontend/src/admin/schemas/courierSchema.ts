import { z } from "zod"

const nonNegativeInt = z
  .number({ error: "Enter a valid amount" })
  .int("Must be a whole number")
  .min(0, "Cannot be negative")
  .max(100_000, "Too large")

export const courierSchema = z.object({
  enabled: z.boolean(),
  flat_fee_enabled: z.boolean(),
  inside_dhaka_fee: nonNegativeInt,
  sub_dhaka_fee: nonNegativeInt,
  outside_dhaka_fee: nonNegativeInt,
  free_delivery_above: z
    .number({ error: "Enter a valid amount" })
    .int("Must be a whole number")
    .min(0)
    .max(1_000_000),
})

export type CourierFormValues = z.infer<typeof courierSchema>

export const defaultCourierValues: CourierFormValues = {
  enabled: true,
  flat_fee_enabled: true,
  inside_dhaka_fee: 60,
  sub_dhaka_fee: 100,
  outside_dhaka_fee: 130,
  free_delivery_above: 2000,
}
