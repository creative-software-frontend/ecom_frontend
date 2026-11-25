export type OrderStatus =
  "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "returned"

export type PaymentStatus = "unpaid" | "paid"

export type OrderCounts = {
  all: { count: number; totalPrice: number }
  pending: { count: number; totalPrice: number }
  confirmed: { count: number; totalPrice: number }
  shipped: { count: number; totalPrice: number }
  delivered: { count: number; totalPrice: number }
  cancelled: { count: number; totalPrice: number }
  returned: { count: number; totalPrice: number }
}

export type OrderListItem = {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  deliveryArea: string
  customerAddress: string
  total: number
  currentPrice?: number
  buyingPrice?: number
  orderStatus: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string
  createdAt: string
  itemCount: number
  shopId: number
  shopName: string
}

export type OrdersListResponse = {
  items: OrderListItem[]
  page: number
  limit: number
  total: number
  areas: string[]
  counts: OrderCounts
}

export type OrderListParams = {
  page?: number
  limit?: number
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  area?: string
  dateFrom?: string
  dateTo?: string
  q?: string
}

export type OrderItemDetail = {
  id: number
  productId: number
  quantity: number
  unitPrice: number
  lineTotal: number
  product: {
    name: string
    slug: string
    image: string | null
  }
}

export type OrderDetail = {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  customerAddress: string
  notes: string | null
  deliveryArea: string
  deliveryCharge: number
  subtotal: number
  discount?: number
  advance?: number
  dueAmount?: number
  total: number
  source?: string | null
  courier?: string | null
  courierNote?: string | null
  assignedToId?: number | null
  assignedTo?: { id: number; name: string } | null
  paymentMethod: string
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  createdAt: string
  shopId: number
  shopName: string
  items: OrderItemDetail[]
}

export type UpdateStatusBody = {
  orderStatus?: OrderStatus
  paymentStatus?: PaymentStatus
}

// ==========================================
// Create Order types
// ==========================================

export type CreateOrderItem = {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  image: string | null
}

export type CreateOrderPayload = {
  customerName: string
  customerPhone: string
  customerAddress: string
  items: { productId: number; quantity: number }[]
  shippingZoneId: string
  advance: number
  discount: number
  assignedToId?: number | null
  courier?: string | null
  source: string
  adminNote?: string | null
  courierNote?: string | null
  shopId?: number
}

export type ShippingZone = {
  id: string
  name: string
  fee: number
}

export type CourierService = {
  id: string
  name: string
}

export type OrderSource = {
  id: string
  name: string
}

export type TeamMember = {
  id: number
  name: string
  role?: string
}

export type PickerProduct = {
  id: number
  name: string
  price: number
  image: string | null
  sku: string
  stockQuantity: number
  inStock: boolean
}
