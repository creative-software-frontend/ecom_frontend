import { apiRequest } from "./client"
import type { OrdersListResponse, OrderListParams } from "../types/order"

export const ordersApi = {
  list(
    params: OrderListParams = {},
    signal?: AbortSignal
  ): Promise<OrdersListResponse> {
    const query = new URLSearchParams()
    if (params.page !== undefined) query.set("page", String(params.page))
    if (params.limit !== undefined) query.set("limit", String(params.limit))
    if (params.status) query.set("status", params.status)
    if (params.q) query.set("q", params.q.trim())
    const qs = query.toString()
    const path = `/admin/orders${qs ? `?${qs}` : ""}`
    return apiRequest<OrdersListResponse>(path, { signal })
  },
}
