import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../api/client"
import { useAuth } from "../auth/AuthProvider"

/**
 * Sidebar badge counts — shape is a union so both shop admin and super
 * admin payloads fit the same type. Fields not relevant to the current
 * role will be undefined.
 */
export type SidebarStats = {
  // Shop admin fields
  pendingOrders?: number
  totalProducts?: number
  // Super admin fields
  totalUsers?: number
  totalShops?: number
  totalRoles?: number
}

export function useSidebarStats() {
  const { state } = useAuth()
  const isAuthenticated = state.status === "authenticated"
  // Super admin has shopId === null; shop users have a shopId.
  const isSuperAdmin = isAuthenticated && state.user.shopId === null

  return useQuery({
    queryKey: ["admin", "sidebar-stats", isSuperAdmin ? "admin" : "shop"],
    queryFn: ({ signal }) =>
      apiRequest<SidebarStats>(
        isSuperAdmin ? "/admin/super/sidebar-stats" : "/shop/sidebar-stats",
        { signal }
      ),
    // Only fetch once the user's role is known.
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  })
}
export const SIDEBAR_STATS_QUERY_KEY = ["admin", "sidebar-stats"] as const
