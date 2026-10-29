import { useState } from "react"
import { Bell, Menu, X } from "lucide-react"
import { useNavigate } from "react-router"
import { useAuth } from "../../auth/AuthProvider"
import { Sidebar } from "./Sidebar"

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [userOpen, setUserOpen] = useState(false)
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    setUserOpen(false)
    try {
      await logout()
    } catch (error: unknown) {
      console.error("Admin logout failed", error)
    } finally {
      navigate("/admin/login", { replace: true })
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <input
          type="search"
          placeholder="Search..."
          className="hidden rounded border border-gray-300 px-3 py-1.5 text-sm md:block"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-100"
            onClick={() => setUserOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setUserOpen(false)
            }}
            aria-expanded={userOpen}
            aria-haspopup="menu"
          >
            <div className="h-8 w-8 rounded-full bg-gray-200" />
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium">
                {state.status === "authenticated" ? state.user.email : ""}
              </div>
            </div>
          </button>
          {userOpen ? (
            <div
              className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg"
              role="menu"
              onMouseLeave={() => setUserOpen(false)}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                role="menuitem"
                onClick={() => {
                  setUserOpen(false)
                  navigate("/admin/profile")
                }}
              >
                Profile
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                onClick={() => setUserOpen(false)}
              >
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                role="menuitem"
                onClick={() => void handleLogout()}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}

export function MobileSidebar({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute top-0 left-0 h-full admin-sidebar-shell">
        <div className="flex h-14 items-center justify-between px-4 admin-sidebar-brand">
          <div className="text-lg font-semibold">ArchitectUI</div>
          <button type="button" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar />
      </div>
    </div>
  )
}
