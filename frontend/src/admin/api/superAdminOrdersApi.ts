import type {
  OrdersListResponse,
  OrderListParams,
  OrderDetail,
  UpdateStatusBody,
  OrderCounts,
} from "../types/order"
import { MOCK_ORDERS } from "../data/superAdminOrdersMock"

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export const superAdminOrdersApi = {
  async list(
    params: OrderListParams & { shopId?: number } = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _signal: AbortSignal
  ): Promise<OrdersListResponse> {
    await delay(200)

    let filtered = [...MOCK_ORDERS]

    if (params.shopId) {
      filtered = filtered.filter((o) => o.shopId === params.shopId)
    }
    if (params.status) {
      filtered = filtered.filter((o) => o.orderStatus === params.status)
    }
    if (params.paymentStatus) {
      filtered = filtered.filter(
        (o) => o.paymentStatus === params.paymentStatus
      )
    }
    if (params.area) {
      filtered = filtered.filter((o) => o.deliveryArea === params.area)
    }
    if (params.q) {
      const q = params.q.toLowerCase()
      filtered = filtered.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.includes(q)
      )
    }

    // Status counts (post-shop-filter, pre-status-filter)
    const shopFiltered = params.shopId
      ? MOCK_ORDERS.filter((o) => o.shopId === params.shopId)
      : MOCK_ORDERS

    const buildCount = (list: typeof MOCK_ORDERS) => ({
      count: list.length,
      totalPrice: list.reduce((s, o) => s + o.total, 0),
    })

    const counts: OrderCounts = {
      all: buildCount(shopFiltered),
      pending: buildCount(
        shopFiltered.filter((o) => o.orderStatus === "pending")
      ),
      confirmed: buildCount(
        shopFiltered.filter((o) => o.orderStatus === "confirmed")
      ),
      shipped: buildCount(
        shopFiltered.filter((o) => o.orderStatus === "shipped")
      ),
      delivered: buildCount(
        shopFiltered.filter((o) => o.orderStatus === "delivered")
      ),
      cancelled: buildCount(
        shopFiltered.filter((o) => o.orderStatus === "cancelled")
      ),
    }

    const areas = [...new Set(shopFiltered.map((o) => o.deliveryArea))]

    const page = params.page ?? 1
    const limit = params.limit ?? 10
    const start = (page - 1) * limit
    const items = filtered.slice(start, start + limit)

    return { items, page, limit, total: filtered.length, areas, counts }
  },

  async get(id: number | string): Promise<OrderDetail> {
    await delay(150)
    const order = MOCK_ORDERS.find((o) => o.id === Number(id))
    if (!order) throw new Error("Order not found")
    return {
      ...order,
      notes: null,
      subtotal: order.total,
      deliveryCharge: 0,
      items: [],
    }
  },

  async updateStatus(
    id: number | string,
    body: UpdateStatusBody
  ): Promise<OrderDetail> {
    await delay(200)
    const idx = MOCK_ORDERS.findIndex((o) => o.id === Number(id))
    if (idx === -1) throw new Error("Order not found")
    if (body.orderStatus) MOCK_ORDERS[idx].orderStatus = body.orderStatus
    if (body.paymentStatus) MOCK_ORDERS[idx].paymentStatus = body.paymentStatus
    return this.get(id)
  },
}

export const superAdminOrderQueryKeys = {
  all: ["admin", "super", "orders"] as const,
  lists: () => [...superAdminOrderQueryKeys.all, "list"] as const,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params: any) => [...superAdminOrderQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...superAdminOrderQueryKeys.all, "detail", id] as const,
}
