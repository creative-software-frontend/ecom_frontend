import { z } from "zod";

/* ================================================================
   Coupon input validation.

   Money fields are integer taka. `expiresAt` accepts ISO strings,
   `YYYY-MM-DD` date-only strings and naive `datetime-local` strings.
   Date-only means "valid throughout that date" in Asia/Dhaka
   (UTC+6), so it is converted to 23:59:59.999+06:00.
   ================================================================ */

const expiresAtSchema = z
  .union([z.date(), z.string().trim().min(1, "Enter a valid expiry date.")])
  .nullable()
  .optional()
  .transform((value): Date | null | undefined => {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value;

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T23:59:59.999+06:00`);
    }
    // <input type="datetime-local"> has no timezone; treat it as Dhaka time.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return new Date(`${value}:00+06:00`);
    }
    if (
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) &&
      !/(Z|[+-]\d{2}:\d{2})$/.test(value)
    ) {
      return new Date(`${value}+06:00`);
    }
    return new Date(value);
  })
  .pipe(z.date({ error: "Enter a valid expiry date." }).nullish());

const couponFields = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, "Code must be at least 3 characters.")
    .max(32, "Code must be 32 characters or fewer.")
    .regex(
      /^[A-Z0-9_-]{3,32}$/,
      "Use only uppercase letters, numbers, hyphens and underscores.",
    ),
  discountType: z.enum(["percentage", "amount"], {
    error: "Select a valid discount type.",
  }),
  discountValue: z
    .number({ error: "Enter a valid discount value." })
    .int("Discount value must be a whole number.")
    .min(1, "Discount value must be at least 1."),
  note: z
    .string()
    .trim()
    .max(120, "Note must be 120 characters or fewer.")
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
  usageLimit: z
    .number({ error: "Enter a valid usage limit." })
    .int("Usage limit must be a whole number.")
    .min(1, "Usage limit must be at least 1.")
    .nullable()
    .optional(),
  maxDiscountValue: z
    .number({ error: "Enter a valid maximum discount." })
    .int("Maximum discount must be a whole number.")
    .min(1, "Maximum discount must be at least 1.")
    .nullable()
    .optional(),
  minPurchaseValue: z
    .number({ error: "Enter a valid minimum purchase." })
    .int("Minimum purchase must be a whole number.")
    .min(0, "Minimum purchase cannot be negative.")
    .nullable()
    .optional(),
  expiresAt: expiresAtSchema,
});

export const createCouponSchema = couponFields
  .extend({
    // "expired" is system-managed via syncExpiredCoupons, never user-supplied.
    status: z
      .enum(["active", "paused"], { error: "Select a valid status." })
      .default("active"),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" || data.discountValue <= 100,
    {
      message: "Percentage discount cannot exceed 100.",
      path: ["discountValue"],
    },
  );

export const updateCouponSchema = couponFields
  .partial()
  .extend({
    status: z
      .enum(["active", "paused"], { error: "Select a valid status." })
      .optional(),
  })
  .refine(
    (data) =>
      data.discountType !== "percentage" ||
      data.discountValue === undefined ||
      data.discountValue <= 100,
    {
      message: "Percentage discount cannot exceed 100.",
      path: ["discountValue"],
    },
  );

export const updateCouponStatusSchema = z.object({
  status: z.enum(["active", "paused"], {
    error: "Select a valid status.",
  }),
});

export const couponListQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "Search query must be 100 characters or fewer.")
    .optional(),
  status: z
    .enum(["active", "paused", "expired"], {
      error: "Select a valid coupon status.",
    })
    .optional(),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type UpdateCouponStatusInput = z.infer<
  typeof updateCouponStatusSchema
>;
export type CouponListQuery = z.infer<typeof couponListQuerySchema>;

/** Field-level 422 errors, matching order.schema.ts. */
export function formatCouponValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field =
      typeof issue.path[0] === "string" ? issue.path[0] : "form";

    if (!(field in errors)) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
