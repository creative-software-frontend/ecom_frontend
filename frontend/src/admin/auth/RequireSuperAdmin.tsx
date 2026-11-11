import { Navigate, Outlet, useLocation } from "react-router"
import { useAuth } from "./AuthProvider"

export function RequireSuperAdmin() {
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
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  // Authenticated but not a super admin — send to shop home
  if (state.user.role !== "super_admin") {
    return <Navigate to="/shop/dashboard" replace />
  }

  return <Outlet />
}

export default RequireSuperAdmin
