import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"
import type {
  OrdersListResponse,
  OrderListParams,
  OrderDetail,
  CreateOrderPayload,
  UpdateStatusBody,
} from "../types/order"

export const ordersApi = {
  create(body: CreateOrderPayload): Promise<OrderDetail> {
    return apiRequest<OrderDetail>("/shop/orders", { method: "POST", body })
  },

  list(
    params: OrderListParams = {},
    signal?: AbortSignal
  ): Promise<OrdersListResponse> {
    const qs = buildQueryString({
      page: params.page,
      limit: params.limit,
      status: params.status,
      paymentStatus: params.paymentStatus,
      area: params.area,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      q: params.q?.trim(),
    })
    return apiRequest<OrdersListResponse>(withQuery("/shop/orders", qs), {
      signal,
    })
  },

  get(id: number | string, signal?: AbortSignal): Promise<OrderDetail> {
    return apiRequest<OrderDetail>(
      `/shop/orders/${encodeURIComponent(String(id))}`,
      {
        signal,
      }
    )
  },

  updateStatus(
    id: number | string,
    body: UpdateStatusBody
  ): Promise<OrderDetail> {
    return apiRequest<OrderDetail>(
      `/shop/orders/${encodeURIComponent(String(id))}/status`,
      { method: "PATCH", body }
    )
  },
}

export const orderQueryKeys = {
  all: ["admin", "orders"] as const,
  lists: () => [...orderQueryKeys.all, "list"] as const,
  list: (params: OrderListParams) =>
    [...orderQueryKeys.lists(), params] as const,
  stats: () => [...orderQueryKeys.all, "stats"] as const,
  detail: (id: number | string) =>
    [...orderQueryKeys.all, "detail", id] as const,
}
