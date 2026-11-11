import { useState } from "react"
import { Outlet } from "react-router"
import { Header, MobileSidebar } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Footer } from "./components/Footer"
import { useAuth } from "../auth/AuthProvider"
import { shopMenu } from "./menu"
import { superAdminMenu } from "./menuSuperAdmin"

export function AdminLayout() {
  const { state } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isSuperAdmin =
    state.status === "authenticated" && state.user.role === "super_admin"
  const menu = isSuperAdmin ? superAdminMenu : shopMenu
  const brandLabel = isSuperAdmin ? "Power Zenox · Platform" : "Power Zenox"

  return (
    <div className="admin-root min-h-screen bg-[#f1f4f6]">
      <div className="flex min-h-screen">
        <aside className="admin-sidebar-shell hidden lg:block">
          <div className="admin-sidebar-brand flex h-14 items-center px-4 text-lg font-semibold">
            {brandLabel}
          </div>
          <Sidebar menu={menu} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onToggleSidebar={() => setMobileOpen(true)} />
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            menu={menu}
            brandLabel={brandLabel}
          />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
