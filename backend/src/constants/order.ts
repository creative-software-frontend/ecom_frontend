export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ALLOWED_ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
} as const;

/** Shared by shop admin and super admin so both enforce identical transitions. */
export function canTransitionOrderStatus(
  currentStatus: string,
  nextStatus: OrderStatus,
): boolean {
  const allowed =
    ALLOWED_ORDER_STATUS_TRANSITIONS[currentStatus as OrderStatus];
  return allowed !== undefined && allowed.includes(nextStatus);
}

/** Cancelled orders are final for both order status and payment status. */
export function canUpdatePaymentStatus(
  currentStatus: string,
  nextOrderStatus?: OrderStatus,
): boolean {
  return currentStatus !== "cancelled" && nextOrderStatus !== "cancelled";
}

