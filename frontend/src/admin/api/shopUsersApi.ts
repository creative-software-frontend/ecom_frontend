import { apiRequest } from "./client"

const BASE = "/shop/users"

export type ShopUserItem = {
  id: number
  email: string
  name: string
  mobile: string
  roleId: number
  role: string
  roleDisplayName: string
  shopId: number
  status: "active" | "inactive"
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type ShopAssignableRole = {
  id: number
  name: string
  displayName: string
  description: string | null
}

export type ShopUsersListResponse = {
  items: ShopUserItem[]
  counts: {
    total: number
    active: number
    inactive: number
  }
}

export type CreateShopUserInput = {
  email: string
  name: string
  mobile?: string | null
  password: string
  roleId: number
  status: "active" | "inactive"
}

export type UpdateShopUserInput = {
  name?: string
  mobile?: string | null
  roleId?: number
  status?: "active" | "inactive"
}

export const shopUserQueryKeys = {
  all: ["admin", "shop", "users"] as const,
  list: () => [...shopUserQueryKeys.all, "list"] as const,
  roles: () => [...shopUserQueryKeys.all, "roles"] as const,
}

export const shopUsersApi = {
  list(signal?: AbortSignal): Promise<ShopUsersListResponse> {
    return apiRequest<ShopUsersListResponse>(BASE, { signal })
  },
  listRoles(signal?: AbortSignal): Promise<ShopAssignableRole[]> {
    return apiRequest<ShopAssignableRole[]>(`${BASE}/roles`, { signal })
  },
  create(input: CreateShopUserInput): Promise<ShopUserItem> {
    return apiRequest<ShopUserItem>(BASE, { method: "POST", body: input })
  },
  update(id: number, input: UpdateShopUserInput): Promise<ShopUserItem> {
    return apiRequest<ShopUserItem>(
      `${BASE}/${encodeURIComponent(String(id))}`,
      {
        method: "PATCH",
        body: input,
      }
    )
  },
  resetPassword(id: number, password: string): Promise<ShopUserItem> {
    return apiRequest<ShopUserItem>(
      `${BASE}/${encodeURIComponent(String(id))}/password`,
      { method: "PATCH", body: { password } }
    )
  },
}
