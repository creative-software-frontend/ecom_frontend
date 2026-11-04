import { useState } from "react"
import { Outlet } from "react-router"
import { Header, MobileSidebar } from "./components/Header"
import { Sidebar } from "./components/Sidebar"
import { Footer } from "./components/Footer"
import { ChevronRight, Leaf } from "lucide-react"
import { Link } from "react-router"
import { useAuth } from "../auth/AuthProvider"

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { state } = useAuth()
  const userEmail =
    state.status === "authenticated" ? state.user.email : "Admin account"
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <div className="admin-root min-h-screen">
      <div className="flex min-h-screen">
        <aside className="admin-sidebar-shell hidden w-48 shrink-0 flex-col border-r border-(--border-light) bg-white lg:flex">
          <div className="admin-sidebar-brand flex h-14 shrink-0 items-center gap-2 border-b border-(--border-light) px-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
              <Leaf className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold text-(--text-primary)">
                Power Zenox
              </p>
              <p className="text-(--text-muted)">Store Admin • BD</p>
            </div>
          </div>
          <div className="min-h-0 flex-1">
            <Sidebar />
          </div>
          <Link
            to="/admin/profile"
            className="flex shrink-0 items-center gap-2 border-t border-(--border-light) p-3 hover:bg-(--bg-surface-hover)"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
              {userInitial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-medium text-(--text-primary)">
                {userEmail}
              </span>
              <span className="block text-[9px] text-(--text-muted)">
                Store Owner / Admin
              </span>
            </span>
            <ChevronRight
              className="size-3.5 text-(--text-muted)"
              aria-hidden="true"
            />
          </Link>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onToggleSidebar={() => setMobileOpen(true)} />
          <MobileSidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
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
