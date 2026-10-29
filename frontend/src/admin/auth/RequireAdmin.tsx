import { Navigate, Outlet, useLocation } from "react-router"
import { useAuth } from "./AuthProvider"

export function RequireAdmin() {
  const { state } = useAuth()
  const location = useLocation()

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] text-sm text-gray-600"
        role="status"
        aria-live="polite"
      >
        Loading admin…
      </div>
    )
  }

  if (state.status === "unauthenticated") {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

export default RequireAdmin
