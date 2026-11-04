import { useState } from "react"
import {
  Bell,
  ExternalLink,
  Leaf,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react"
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
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-(--border-light) bg-white px-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-(--text-muted) hover:bg-(--bg-surface-hover) lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>
        <label className="relative hidden w-full max-w-md md:block">
          <span className="sr-only">Search admin workspace</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-(--text-muted)"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search orders, customers, products..."
            className="h-8 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-3 pl-9 text-[11px] text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-brand-soft px-2 py-1 text-[9px] font-medium text-primary sm:inline-flex">
          <span className="size-1.5 rounded-full bg-primary" />
          Live Store (BD)
        </span>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1 text-[10px] text-(--text-primary) hover:text-primary sm:inline-flex"
        >
          <ExternalLink className="size-3" aria-hidden="true" />
          Storefront
        </a>
        <button
          type="button"
          className="relative inline-flex items-center justify-center rounded-md p-1.5 text-(--text-muted) hover:bg-(--bg-surface-hover)"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-[#e07047]" />
        </button>
        <div className="relative">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md p-1.5 text-primary hover:bg-(--bg-surface-hover)"
            onClick={() => setUserOpen((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setUserOpen(false)
            }}
            aria-expanded={userOpen}
            aria-haspopup="menu"
          >
            <UserRound className="size-4" />
            <span className="sr-only">
              {state.status === "authenticated" ? state.user.email : "Admin"}
            </span>
          </button>
          {userOpen ? (
            <div
              className="absolute right-0 z-30 mt-2 w-48 rounded-md border border-(--border-light) bg-white py-1 shadow-lg"
              role="menu"
              onMouseLeave={() => setUserOpen(false)}
            >
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-(--bg-surface-hover)"
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
                className="block w-full px-3 py-2 text-left text-xs hover:bg-(--bg-surface-hover)"
                role="menuitem"
                onClick={() => {
                  setUserOpen(false)
                  navigate("/admin/settings")
                }}
              >
                Settings
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-xs hover:bg-(--bg-surface-hover)"
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
      <div className="admin-sidebar-shell absolute top-0 left-0 flex h-full w-64 flex-col">
        <div className="admin-sidebar-brand flex h-14 shrink-0 items-center justify-between border-b border-(--border-light) px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
              <Leaf className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-(--text-primary)">
              Power Zenox
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close sidebar">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
