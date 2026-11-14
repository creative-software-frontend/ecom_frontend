import { useQuery } from "@tanstack/react-query"
import { superAdminApi } from "../api/superAdminApi"
import type {
  CreateShopInput,
  UpdateShopInput,
  UserListParams,
} from "../types/superAdmin"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { CreateUserInput, UpdateUserInput } from "../types/superAdmin"
import type { CreateRoleInput, UpdateRoleInput } from "../types/superAdmin"
import type { AuditLogQueryParams } from "../types/superAdmin"
import { SIDEBAR_STATS_QUERY_KEY } from "./useSidebarStats"
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
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
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
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
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
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      superAdminApi.users.resetPassword(id, password),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY })
    },
  })
}

export function useCreateRoleMutation() {
  const qc = useQueryClient()
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
  return useMutation({
    mutationFn: (data: CreateRoleInput) => superAdminApi.roles.create(data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_ROLES_QUERY_KEY })
    },
  })
}

export function useUpdateRoleMutation() {
  const qc = useQueryClient()
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleInput }) =>
      superAdminApi.roles.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_ROLES_QUERY_KEY })
    },
  })
}

export function useDeleteRoleMutation() {
  const qc = useQueryClient()
  qc.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
  return useMutation({
    mutationFn: (id: number) => superAdminApi.roles.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_ROLES_QUERY_KEY })
    },
  })
}

export function useSuperAdminDashboardQuery() {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_QUERY_KEY,
    queryFn: ({ signal }) => superAdminApi.dashboard.get(signal),
    staleTime: 30 * 1000,
  })
}
export const ADMIN_USERS_QUERY_KEY = ["admin", "super", "users"] as const
export const ADMIN_ROLES_QUERY_KEY = ["admin", "super", "roles"] as const
export const ADMIN_SHOPS_QUERY_KEY = ["admin", "super", "shops"] as const
export const ADMIN_DASHBOARD_QUERY_KEY = [
  "admin",
  "super",
  "dashboard",
] as const

export const ADMIN_SHOPS_LIST_QUERY_KEY = [
  "admin",
  "super",
  "shops",
  "list",
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useAdminShopsPaginated(params: any = {}) {
  return useQuery({
    queryKey: [...ADMIN_SHOPS_LIST_QUERY_KEY, params],
    queryFn: ({ signal }) => superAdminApi.shops.getPaginated(params, signal),
    staleTime: 30 * 1000,
  })
}

export const ADMIN_AUDIT_QUERY_KEY = ["admin", "super", "audit"] as const

export function useAdminAuditLogs(params: AuditLogQueryParams) {
  return useQuery({
    queryKey: [...ADMIN_AUDIT_QUERY_KEY, params],
    queryFn: ({ signal }) => superAdminApi.audit.list(params, signal),
    // ফ্লিকার বন্ধ করার জন্য keepPreviousData (placeholderData) ব্যবহার করা হলো
    placeholderData: (prev) => prev,
  })
}

// ==========================================
// SHOPS MUTATIONS
// ==========================================

export function useCreateShopMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShopInput) => superAdminApi.shops.create(data),
    onSuccess: () => {
      // ইনভ্যালিডেট করা হচ্ছে যাতে টেবিল এবং সাইডবারের কাউন্ট আপডেট হয়
      void qc.invalidateQueries({ queryKey: ADMIN_SHOPS_LIST_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ADMIN_SHOPS_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ["admin", "sidebar-stats"] })
    },
  })
}

export function useUpdateShopMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateShopInput }) =>
      superAdminApi.shops.update(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_SHOPS_LIST_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: ADMIN_SHOPS_QUERY_KEY })
    },
  })
}
