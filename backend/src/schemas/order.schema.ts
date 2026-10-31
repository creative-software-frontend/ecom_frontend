import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../constants/order.js";

export const orderListQuerySchema = z.object({
  page: z.coerce
    .number({ error: "Page must be an integer" })
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number({ error: "Limit must be an integer" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
  status: z
    .enum(ORDER_STATUSES, {
      error: "Invalid order status",
    })
    .optional(),
  q: z
    .string()
    .trim()
    .max(100, "Search query must be 100 characters or fewer")
    .optional(),
});

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const updateOrderStatusSchema = z
  .object({
    orderStatus: z
      .enum(ORDER_STATUSES, {
        error: "Invalid order status",
      })
      .optional(),
    paymentStatus: z
      .enum(PAYMENT_STATUSES, {
        error: "Invalid payment status",
      })
      .optional(),
  })
  .strip()
  .refine(
    (data) =>
      data.orderStatus !== undefined || data.paymentStatus !== undefined,
    {
      message: "At least one of orderStatus or paymentStatus is required",
      path: ["form"],
    },
  );

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export function formatOrderValidationErrors(
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

