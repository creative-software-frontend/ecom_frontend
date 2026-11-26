import type { AdminUser } from "../auth/AuthProvider"

export type PermissionCheck = readonly [resource: string, action: string]

function hasPermission(
  permissions: AdminUser["permissions"] | undefined,
  resource: string,
  action: string
): boolean {
  if (permissions?.["*"]?.includes("*")) return true
  const actions = permissions?.[resource]
  return Boolean(actions?.includes("*") || actions?.includes(action))
}

export function can(
  user: AdminUser | null | undefined,
  resource: string,
  action: string
): boolean {
  return hasPermission(user?.permissions, resource, action)
}

export function canAny(
  user: AdminUser | null | undefined,
  checks: readonly PermissionCheck[]
): boolean {
  return checks.some(([resource, action]) =>
    hasPermission(user?.permissions, resource, action)
  )
}

/** Single source of truth for settings tab access (sidebar, routes, tabs). */
export const SETTINGS_TAB_ACCESS: readonly {
  id: string
  checks: readonly PermissionCheck[]
}[] = [
  { id: "store", checks: [["settings", "read"]] },
  { id: "storefront", checks: [["settings", "read"]] },
  { id: "orders", checks: [["settings", "read"]] },
  { id: "coupons", checks: [["coupons", "read"]] },
  { id: "pages", checks: [["pages", "read"]] },
  { id: "marketing", checks: [["marketing", "read"]] },
  { id: "courier", checks: [["courier", "read"]] },
  { id: "sms", checks: [["settings", "read"]] },
]

export function canReadSettingsTab(
  user: AdminUser | null | undefined,
  tabId: string
): boolean {
  const entry = SETTINGS_TAB_ACCESS.find((tab) => tab.id === tabId)
  return entry ? canAny(user, entry.checks) : false
}

export const ANY_SETTINGS_TAB: readonly PermissionCheck[] = [
  ["settings", "read"],
  ["coupons", "read"],
  ["pages", "read"],
  ["courier", "read"],
  ["marketing", "read"],
]
