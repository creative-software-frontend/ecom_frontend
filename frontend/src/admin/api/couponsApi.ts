import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"
import type {
  Coupon,
  CouponListParams,
  CouponStatusUpdateInput,
  CouponsListResponse,
  CouponWriteInput,
} from "../types/coupon"

export const couponsApi = {
  list(
    params: CouponListParams = {},
    signal?: AbortSignal
  ): Promise<CouponsListResponse> {
    const qs = buildQueryString({ q: params.q?.trim(), status: params.status })
    return apiRequest<CouponsListResponse>(withQuery("/shop/coupons", qs), {
      signal,
    })
  },

  get(id: number | string, signal?: AbortSignal): Promise<Coupon> {
    return apiRequest<Coupon>(
      `/shop/coupons/${encodeURIComponent(String(id))}`,
      {
        signal,
      }
    )
  },

  create(input: CouponWriteInput): Promise<Coupon> {
    return apiRequest<Coupon>("/shop/coupons", {
      method: "POST",
      body: input,
    })
  },

  update(id: number | string, input: CouponWriteInput): Promise<Coupon> {
    return apiRequest<Coupon>(
      `/shop/coupons/${encodeURIComponent(String(id))}`,
      {
        method: "PUT",
        body: input,
      }
    )
  },

  updateStatus(
    id: number | string,
    input: CouponStatusUpdateInput
  ): Promise<Coupon> {
    return apiRequest<Coupon>(
      `/shop/coupons/${encodeURIComponent(String(id))}/status`,
      { method: "PATCH", body: input }
    )
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(`/shop/coupons/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    })
  },
}

export const couponQueryKeys = {
  all: ["admin", "coupons"] as const,
  lists: () => [...couponQueryKeys.all, "list"] as const,
  list: (params: CouponListParams) =>
    [...couponQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...couponQueryKeys.all, "detail", id] as const,
}
