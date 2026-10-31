import type { OrderStatus, PaymentStatus } from "../types/order"

export type BadgeVariant = "warning" | "info" | "primary" | "success" | "danger"

export type StatusConfig = {
  label: string
  variant: BadgeVariant
  badgeClassName: string
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: "Pending",
    variant: "warning",
    badgeClassName: "admin-badge admin-badge--warning",
  },
  confirmed: {
    label: "Confirmed",
    variant: "info",
    badgeClassName: "admin-badge admin-badge--info",
  },
  shipped: {
    label: "Shipped",
    variant: "primary",
    badgeClassName: "admin-badge admin-badge--primary",
  },
  delivered: {
    label: "Delivered",
    variant: "success",
    badgeClassName: "admin-badge admin-badge--success",
  },
  cancelled: {
    label: "Cancelled",
    variant: "danger",
    badgeClassName: "admin-badge admin-badge--danger",
  },
}

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  unpaid: {
    label: "Unpaid",
    variant: "warning",
    badgeClassName: "admin-badge admin-badge--warning",
  },
  paid: {
    label: "Paid",
    variant: "success",
    badgeClassName: "admin-badge admin-badge--success",
  },
}

/**
 * Which order statuses each status can transition to.
 * Empty array means it is a final state.
 * The server is the authority; this only controls which buttons to render.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
}

/** Label shown on the action button for each target status */
export const ORDER_STATUS_ACTION_LABEL: Record<OrderStatus, string> = {
  pending: "Mark as pending",
  confirmed: "Mark as confirmed",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
}

export function getOrderStatusConfig(status: OrderStatus): StatusConfig {
  return (
    ORDER_STATUS_CONFIG[status] ?? {
      label: status,
      variant: "warning",
      badgeClassName: "admin-badge admin-badge--warning",
    }
  )
}

export function getPaymentStatusConfig(status: PaymentStatus): StatusConfig {
  return (
    PAYMENT_STATUS_CONFIG[status] ?? {
      label: status,
      variant: "warning",
      badgeClassName: "admin-badge admin-badge--warning",
    }
  )
}

export function formatOrderDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date)
  } catch {
    return "N/A"
  }
}

export function formatTaka(price: number): string {
  return `৳ ${new Intl.NumberFormat("en-BD").format(price)}`
}

