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
  },

  dashboard: {
    get(signal?: AbortSignal): Promise<SuperAdminDashboardData> {
      return apiRequest<SuperAdminDashboardData>(`${BASE}/dashboard`, {
        signal,
      })
    },
  },
}
