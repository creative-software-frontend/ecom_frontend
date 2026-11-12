import { apiRequest } from "./client"
import type {
  SuperAdminUser,
  UsersListResponse,
  UserListParams,
  SuperAdminRole,
  SuperAdminShop,
  CreateUserInput,
  UpdateUserInput,
  UpdateRoleInput,
  CreateRoleInput,
  SuperAdminDashboardData,
  SuperAdminShopListItem,
  ShopsListResponse,
  AuditLogResponse,
  AuditLogQueryParams,
} from "../types/superAdmin"

const BASE = "/admin/super"

export const superAdminApi = {
  users: {
    list(
      params: UserListParams = {},
      signal?: AbortSignal
    ): Promise<UsersListResponse> {
      const q = new URLSearchParams()
      if (params.page !== undefined) q.set("page", String(params.page))
      if (params.limit !== undefined) q.set("limit", String(params.limit))
      if (params.q) q.set("q", params.q.trim())
      if (params.roleId !== undefined) q.set("roleId", String(params.roleId))
      if (params.shopId !== undefined) q.set("shopId", String(params.shopId))
      if (params.status) q.set("status", params.status)
      const qs = q.toString()
      return apiRequest<UsersListResponse>(
        `${BASE}/users${qs ? `?${qs}` : ""}`,
        { signal }
      )
    },
    create(data: CreateUserInput): Promise<SuperAdminUser> {
      return apiRequest<SuperAdminUser>(`${BASE}/users`, {
        method: "POST",
        body: data,
      })
    },
    update(id: number, data: UpdateUserInput): Promise<SuperAdminUser> {
      return apiRequest<SuperAdminUser>(`${BASE}/users/${id}`, {
        method: "PATCH",
        body: data,
      })
    },
    resetPassword(id: number, password: string): Promise<SuperAdminUser> {
      return apiRequest<SuperAdminUser>(`${BASE}/users/${id}/password`, {
        method: "PATCH",
        body: { password },
      })
    },
    deactivate(id: number): Promise<SuperAdminUser> {
      return apiRequest<SuperAdminUser>(`${BASE}/users/${id}`, {
        method: "DELETE",
      })
    },
  },
  roles: {
    list(signal?: AbortSignal): Promise<SuperAdminRole[]> {
      return apiRequest<SuperAdminRole[]>(`${BASE}/roles`, { signal })
    },
    create(data: CreateRoleInput): Promise<SuperAdminRole> {
      return apiRequest<SuperAdminRole>(`${BASE}/roles`, {
        method: "POST",
        body: data,
      })
    },
    update(id: number, data: UpdateRoleInput): Promise<SuperAdminRole> {
      return apiRequest<SuperAdminRole>(`${BASE}/roles/${id}`, {
        method: "PATCH",
        body: data,
      })
    },
    remove(id: number): Promise<void> {
      return apiRequest<void>(`${BASE}/roles/${id}`, { method: "DELETE" })
    },
  },
  shops: {
    list(signal?: AbortSignal): Promise<SuperAdminShop[]> {
      return apiRequest<SuperAdminShop[]>(`${BASE}/shops`, { signal })
    },
    // নতুন: Shops List-এর জন্য ডেটা নিয়ে আসার ফাংশন (আপাতত ব্যাকএন্ড ডেটার উপর ডামি ডেটা ম্যাপ করা হবে)
    getPaginated(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params: any = {},
      signal?: AbortSignal
    ): Promise<ShopsListResponse> {
      return apiRequest<SuperAdminShop[]>(`${BASE}/shops`, { signal }).then(
        (shops) => {
          const plans = ["Enterprise", "Growth", "Starter", "14-day Free Trial"]
          const owners = [
            "Abdur Razzaq",
            "Mahfuz Alam",
            "Abdur Rahim",
            "Rezaul Karim",
            "Nusrat Jahan Khan",
          ]

          const items: SuperAdminShopListItem[] = shops.map((shop, index) => ({
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            ownerName: owners[index % owners.length],
            ownerMobile: shop.mobile || "+880 1711-000000",
            status:
              shop.status === "inactive"
                ? "inactive"
                : shop.status === "trial"
                  ? "trial"
                  : "active",
            planName: plans[index % plans.length],
            expiresAt: shop.expiryDate || shop.trialEndsAt || null,
            userCount: shop.userCount || 0,
          }))

          // সার্চ ফিল্টার (ফ্রন্টএন্ডে আপাতত)
          let filtered = items
          if (params.q) {
            filtered = items.filter((i) =>
              i.name.toLowerCase().includes(params.q.toLowerCase())
            )
          }
          if (params.status && params.status !== "all") {
            filtered = filtered.filter((i) => i.status === params.status)
          }

          return {
            items: filtered,
            page: 1,
            limit: 10,
            total: filtered.length,
            counts: {
              total: items.length,
              active: items.filter((i) => i.status === "active").length,
              trial: items.filter((i) => i.status === "trial").length,
              inactive: items.filter((i) => i.status === "inactive").length,
            },
          }
        }
      )
    },
  },

  dashboard: {
    get(signal?: AbortSignal): Promise<SuperAdminDashboardData> {
      return apiRequest<SuperAdminDashboardData>(`${BASE}/dashboard`, {
        signal,
      })
    },
  },

  audit: {
    list(
      params: AuditLogQueryParams,
      signal?: AbortSignal
    ): Promise<AuditLogResponse> {
      const q = new URLSearchParams()
      q.set("page", String(params.page))
      q.set("limit", String(params.limit))
      if (params.q) q.set("q", params.q)
      if (params.action) q.set("action", params.action)
      if (params.shopId !== undefined) q.set("shopId", String(params.shopId))

      const qs = q.toString()
      return apiRequest<AuditLogResponse>(
        `${BASE}/audit${qs ? `?${qs}` : ""}`,
        { signal }
      )
    },
  },
}
