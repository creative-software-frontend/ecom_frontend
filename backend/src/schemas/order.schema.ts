import { z } from "zod";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  type OrderStatus,
} from "../constants/order.js";

export const orderListQuerySchema = z
  .object({
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
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    area: z.string().trim().max(100).optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    q: z
      .string()
      .trim()
      .max(100, "Search query must be 100 characters or fewer")
      .optional(),
  })
  .refine(
    ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
    {
      message: "Start date must be on or before end date",
      path: ["dateTo"],
    },
  );

export type OrderListQuery = z.infer<typeof orderListQuerySchema>;

export const ORDER_SOURCES = [
  "whatsapp",
  "facebook",
  "phone",
  "website",
  "walk-in",
] as const;

export const ORDER_COURIERS = [
  "steadfast",
  "pathao",
  "redx",
  "carrybee",
] as const;

export const SHIPPING_ZONE_IDS = [
  "inside-dhaka",
  "sub-dhaka",
  "outside-dhaka",
  "free",
] as const;

function blankToNull(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? null : value;
}

function optionalNullableId(value: unknown): unknown {
  return value === "" || value === null ? null : value;
}

export const createAdminOrderSchema = z.object({
  customerName: z.string().trim().min(1).max(120),
  customerPhone: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "Enter a valid BD phone (01XXXXXXXXX)"),
  customerAddress: z.string().trim().min(1).max(500),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().min(1).max(1000),
      }),
    )
    .min(1, "Add at least one product"),
  shippingZoneId: z.enum(SHIPPING_ZONE_IDS, {
    error: "Select a valid shipping zone",
  }),
  advance: z.coerce.number().int().min(0).default(0),
  discount: z.coerce.number().int().min(0).default(0),
  assignedToId: z.preprocess(
    optionalNullableId,
    z.coerce.number().int().positive().nullable().optional(),
  ),
  courier: z.preprocess(
    blankToNull,
    z.enum(ORDER_COURIERS).nullable().optional(),
  ),
  source: z.enum(ORDER_SOURCES).default("whatsapp"),
  adminNote: z.preprocess(
    blankToNull,
    z.string().trim().max(1000).nullable().optional(),
  ),
  courierNote: z.preprocess(
    blankToNull,
    z.string().trim().max(1000).nullable().optional(),
  ),
  // Super Admin only — shop admins are always scoped by their auth cookie.
  shopId: z.coerce.number().int().positive().optional(),
});

export type CreateAdminOrderInput = z.infer<typeof createAdminOrderSchema>;

export const updateOrderStatusSchema = z
  .object({
    orderStatus: z
      .enum(ORDER_STATUSES, {
        error: "Invalid order status",
      })
      .optional(),
    // `status` is accepted as an alias so both admin APIs share one schema.
    status: z
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
      data.orderStatus !== undefined ||
      data.status !== undefined ||
      data.paymentStatus !== undefined,
    {
      message: "At least one of orderStatus or paymentStatus is required",
      path: ["form"],
    },
  )
  .refine(
    (data) =>
      data.orderStatus === undefined ||
      data.status === undefined ||
      data.orderStatus === data.status,
    {
      message: "status and orderStatus must match when both are provided",
      path: ["status"],
    },
  );

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

/** Normalize the status alias before applying the shared transition rules. */
export function getRequestedOrderStatus(
  input: UpdateOrderStatusInput,
): OrderStatus | undefined {
  return input.orderStatus ?? input.status;
}

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
