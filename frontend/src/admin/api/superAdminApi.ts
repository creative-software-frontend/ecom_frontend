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
  UpdateShopInput,
  CreateShopInput,
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
    // ১. ব্যাকএন্ড থেকে সরাসরি লিস্ট আনা (Raw)
    list(signal?: AbortSignal): Promise<SuperAdminShop[]> {
      return apiRequest<SuperAdminShop[]>(`${BASE}/shops`, { signal })
    },

    // ২. নতুন শপ তৈরি করা
    create(data: CreateShopInput): Promise<SuperAdminShop> {
      return apiRequest<SuperAdminShop>(`${BASE}/shops`, {
        method: "POST",
        body: data,
      })
    },

    // ৩. শপ আপডেট করা (ভবিষ্যতে Edit/Suspend এর জন্য কাজে লাগবে)
    update(id: number, data: UpdateShopInput): Promise<SuperAdminShop> {
      return apiRequest<SuperAdminShop>(`${BASE}/shops/${id}`, {
        method: "PATCH",
        body: data,
      })
    },

    // ৪. ফ্রন্টএন্ডে ফিল্টার এবং পেজিনেশন
    getPaginated(
      params: {
        q?: string
        status?: string
        page?: number
        limit?: number
      } = {},
      signal?: AbortSignal
    ): Promise<ShopsListResponse> {
      return this.list(signal).then((shops) => {
        // NOTE: Plan এবং OwnerName আপাতত ডামি, কারণ ব্যাকএন্ড DB-তে এই কলামগুলো নেই।
        // Phase B-তে DB-তে ফিল্ড যোগ হলে এই ডামি ম্যাপিং সরিয়ে ফেলতে হবে।
        const plans = ["Enterprise", "Growth", "Starter", "14-day Free Trial"]
        const owners = [
          "Abdur Razzaq",
          "Mahfuz Alam",
          "Abdur Rahim",
          "Rezaul Karim",
          "Nusrat Jahan Khan",
        ]

        // ব্যাকএন্ড ডেটাকে ফ্রন্টএন্ডের UI মডেলে রূপান্তর
        let items: SuperAdminShopListItem[] = shops.map((shop, index) => ({
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          ownerName: owners[index % owners.length], // ডামি
          ownerMobile: shop.mobile || "N/A",
          status: (shop.status as "active" | "trial" | "inactive") || "active",
          planName: plans[index % plans.length], // ডামি
          expiresAt: shop.expiryDate || shop.trialEndsAt || null,
          userCount: shop.userCount || 0,
        }))

        // সার্চ ফিল্টার (Name বা Slug দিয়ে)
        if (params.q) {
          const query = params.q.toLowerCase()
          items = items.filter(
            (i) =>
              i.name.toLowerCase().includes(query) ||
              i.slug.toLowerCase().includes(query)
          )
        }

        // স্ট্যাটাস ফিল্টার
        if (params.status && params.status !== "all") {
          items = items.filter((i) => i.status === params.status)
        }

        // কাউন্ট ক্যালকুলেশন (পেজিনেশনের আগে)
        const counts = {
          total: items.length,
          active: items.filter((i) => i.status === "active").length,
          trial: items.filter((i) => i.status === "trial").length,
          inactive: items.filter((i) => i.status === "inactive").length,
        }

        // লোকাল পেজিনেশন
        const page = params.page || 1
        const limit = params.limit || 10
        const total = items.length
        const paginatedItems = items.slice((page - 1) * limit, page * limit)

        return {
          items: paginatedItems,
          page,
          limit,
          total,
          counts,
        }
      })
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
