export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"

export type PaymentStatus = "unpaid" | "paid"

export type OrderCounts = {
  all: number
  pending: number
  confirmed: number
  shipped: number
  delivered: number
  cancelled: number
}

export type OrderListItem = {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  deliveryArea: string
  total: number
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  createdAt: string
  itemCount: number
}

export type OrdersListResponse = {
  items: OrderListItem[]
  page: number
  limit: number
  total: number
  counts: OrderCounts
}

export type OrderListParams = {
  page?: number
  limit?: number
  status?: OrderStatus
  q?: string
}

