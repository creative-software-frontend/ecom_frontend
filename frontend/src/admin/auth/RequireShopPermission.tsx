import type { ReactNode } from "react"
import { Link, Navigate, Outlet, useLocation } from "react-router"
import { ShieldAlert } from "lucide-react"
import { can, canAny, type PermissionCheck } from "../lib/permissions"
import { useAuth } from "./AuthProvider"

export function ShopAccessDenied() {
  return (
    <div className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) p-6">
      <div className="w-full max-w-md rounded-md border border-(--border-light) bg-(--bg-surface) px-6 py-8 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-(--bg-surface-hover)">
          <ShieldAlert className="size-6 text-(--text-muted)" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-(--text-primary)">
          Access Denied (403)
        </h1>
        <p className="mt-2 text-sm text-(--text-muted)">
          You don't have permission to view this page.
        </p>
        <Link
          to="/shop/dashboard"
          className="mt-5 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover)"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

export type RequireShopPermissionProps = {
  anyOf?: readonly PermissionCheck[]
  shopAdminOnly?: boolean
  children?: ReactNode
}

export default function RequireShopPermission({
  anyOf,
  shopAdminOnly = false,
  children,
}: RequireShopPermissionProps) {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) text-sm text-(--text-muted)"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    )
  }

  if (state.status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  const user = state.user
  const allowed = shopAdminOnly
    ? user.role === "shop_admin" || can(user, "*", "*")
    : !anyOf || canAny(user, anyOf)

  if (!allowed) return <ShopAccessDenied />

  return <>{children ?? <Outlet />}</>
}
