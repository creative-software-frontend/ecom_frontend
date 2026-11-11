import { useQuery } from "@tanstack/react-query"
import { superAdminApi } from "../api/superAdminApi"
import type { UserListParams } from "../types/superAdmin"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateUserInput, UpdateUserInput } from "../types/superAdmin"
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

export function useCreateAdminUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUserInput) => superAdminApi.users.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ADMIN_ROLES_QUERY_KEY })
    },
  })
}

export function useUpdateAdminUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateUserInput }) =>
      superAdminApi.users.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ADMIN_ROLES_QUERY_KEY })
    },
  })
}

export function useResetAdminUserPasswordMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      superAdminApi.users.resetPassword(id, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
    },
  })
}
