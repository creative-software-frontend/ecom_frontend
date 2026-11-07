import { z } from "zod"

// Form schema for Create/Edit coupon modal.
// Number fields are kept as `number` in state; inputs use `setValueAs`
// to convert DOM strings safely (empty -> 0 or null).
export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Minimum 3 characters")
      .max(20, "Maximum 20 characters")
      .regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
    discount_type: z.enum(["percentage", "amount"]),
    discount_value: z
      .number({ error: "Enter a valid number" })
      .int("Whole number only")
      .min(1, "Minimum 1"),
    max_discount: z.object({
      enabled: z.boolean(),
      value: z.number({ error: "Enter a valid amount" }).int().min(0),
    }),
    min_purchase: z.object({
      enabled: z.boolean(),
      value: z.number({ error: "Enter a valid amount" }).int().min(0),
    }),
    usage_limit: z
      .number({ error: "Enter a valid number" })
      .int()
      .min(1, "Minimum 1")
      .nullable(),
    expires_at: z.string().nullable(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    // Percentage cap — 100% is the max meaningful discount.
    if (data.discount_type === "percentage" && data.discount_value > 100) {
      ctx.addIssue({
        code: "custom",
        path: ["discount_value"],
        message: "Percentage cannot exceed 100",
      })
    }
    // Toggled ON but amount is 0 -> invalid.
    if (data.max_discount.enabled && data.max_discount.value < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["max_discount", "value"],
        message: "Enter a positive amount",
      })
    }
    if (data.min_purchase.enabled && data.min_purchase.value < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["min_purchase", "value"],
        message: "Enter a positive amount",
      })
    }
  })

export type CouponFormValues = z.infer<typeof couponFormSchema>

// Default form values — empty code so the Generate button is meaningful.
export const defaultCouponFormValues: CouponFormValues = {
  code: "",
  discount_type: "percentage",
  discount_value: 15,
  max_discount: { enabled: true, value: 500 },
  min_purchase: { enabled: true, value: 1500 },
  usage_limit: 100,
  expires_at: null,
  active: true,
}

// Generate a random uppercase code with unambiguous characters.
// Skipped: 0/O/I/1 — visually confusing when read over phone.
export function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
