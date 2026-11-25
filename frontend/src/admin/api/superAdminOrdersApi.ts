import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"
import type {
  OrderDetail,
  OrderListItem,
  OrderListParams,
  OrdersListResponse,
  CreateOrderPayload,
  UpdateStatusBody,
} from "../types/order"

type ApiShopSummary = {
  id: number
  name: string
  slug: string
}

type RawOrderListItem = Omit<OrderListItem, "shopName"> & {
  shopName?: string
  shop?: ApiShopSummary | null
}

type RawOrdersListResponse = Omit<OrdersListResponse, "items"> & {
  items: RawOrderListItem[]
}

type RawOrderDetail = Omit<OrderDetail, "shopName"> & {
  shopName?: string
  shop?: ApiShopSummary | null
}

function normalizeOrderListItem(item: RawOrderListItem): OrderListItem {
  const { shop, shopName, ...rest } = item
  return {
    ...rest,
    shopName: shopName ?? shop?.name ?? "",
  }
}

function normalizeOrderDetail(detail: RawOrderDetail): OrderDetail {
  const { shop, shopName, ...rest } = detail
  return {
    ...rest,
    shopName: shopName ?? shop?.name ?? "",
  }
}

export const superAdminOrdersApi = {
  async create(body: CreateOrderPayload): Promise<OrderDetail> {
    const res = await apiRequest<RawOrderDetail>("/admin/super/orders", {
      method: "POST",
      body,
    })
    return normalizeOrderDetail(res)
  },

  async list(
    params: OrderListParams & { shopId?: number } = {},
    signal?: AbortSignal
  ): Promise<OrdersListResponse> {
    const qs = buildQueryString({
      page: params.page,
      limit: params.limit,
      shopId: params.shopId,
      status: params.status,
      paymentStatus: params.paymentStatus,
      area: params.area,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      q: params.q?.trim(),
    })

    const res = await apiRequest<RawOrdersListResponse>(
      withQuery("/admin/super/orders", qs),
      { signal }
    )

    return {
      ...res,
      items: res.items.map(normalizeOrderListItem),
    }
  },

  async get(id: number | string, signal?: AbortSignal): Promise<OrderDetail> {
    const res = await apiRequest<RawOrderDetail>(
      `/admin/super/orders/${encodeURIComponent(String(id))}`,
      { signal }
    )
    return normalizeOrderDetail(res)
  },

  async updateStatus(
    id: number | string,
    body: UpdateStatusBody
  ): Promise<OrderDetail> {
    const res = await apiRequest<RawOrderDetail>(
      `/admin/super/orders/${encodeURIComponent(String(id))}/status`,
      { method: "PATCH", body }
    )
    return normalizeOrderDetail(res)
  },
}

export const superAdminOrderQueryKeys = {
  all: ["admin", "super", "orders"] as const,
  lists: () => [...superAdminOrderQueryKeys.all, "list"] as const,
  list: (params: OrderListParams & { shopId?: number }) =>
    [...superAdminOrderQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...superAdminOrderQueryKeys.all, "detail", id] as const,
}
