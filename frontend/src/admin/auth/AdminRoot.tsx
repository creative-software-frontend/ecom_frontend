import { Outlet } from "react-router"
import { AuthProvider } from "./AuthProvider"

export function AdminRoot() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}

export default AdminRoot
