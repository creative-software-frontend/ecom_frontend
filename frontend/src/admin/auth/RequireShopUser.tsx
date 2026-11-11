import { Navigate, Outlet, useLocation } from "react-router"
import { useAuth } from "./AuthProvider"

export function RequireShopUser() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] text-sm text-gray-600"
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

  // Super admin (no shop) shouldn't access shop routes — send to admin home
  if (state.user.shopId === null) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return <Outlet />
}

export default RequireShopUser
