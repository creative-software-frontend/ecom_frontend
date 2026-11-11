import { useQuery } from "@tanstack/react-query"
import { superAdminApi } from "../api/superAdminApi"
import type { UserListParams } from "../types/superAdmin"

export const ADMIN_USERS_QUERY_KEY = ["admin", "super", "users"] as const
export const ADMIN_ROLES_QUERY_KEY = ["admin", "super", "roles"] as const
export const ADMIN_SHOPS_QUERY_KEY = ["admin", "super", "shops"] as const

export function useAdminUsersList(params: UserListParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: ({ signal }) => superAdminApi.users.list(params, signal),
    staleTime: 30 * 1000,
  })
}

export function useAdminRolesList() {
  return useQuery({
    queryKey: ADMIN_ROLES_QUERY_KEY,
    queryFn: ({ signal }) => superAdminApi.roles.list(signal),
    staleTime: 5 * 60 * 1000, // roles rarely change
  })
}

export function useAdminShopsList() {
  return useQuery({
    queryKey: ADMIN_SHOPS_QUERY_KEY,
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
    staleTime: 60 * 1000,
  })
}
