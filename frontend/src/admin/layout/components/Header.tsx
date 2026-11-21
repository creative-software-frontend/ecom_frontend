import { useEffect, useRef, useState } from "react"
import { Bell, ChevronDown, Menu, Plus, Wallet, X } from "lucide-react"
import { useNavigate } from "react-router"
import { useAuth } from "../../auth/AuthProvider"
import { Sidebar } from "./Sidebar"
import type { MenuItem } from "../menu"

export function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const [userOpen, setUserOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const walletRef = useRef<HTMLDivElement>(null)
  const { state, logout } = useAuth()
  const navigate = useNavigate()

  const isSuperAdmin =
    state.status === "authenticated" && state.user.role === "super_admin"
  const profilePath = isSuperAdmin ? "/admin/profile" : "/shop/profile"

  useEffect(() => {
    if (!walletOpen) return

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !walletRef.current?.contains(event.target)
      ) {
        setWalletOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setWalletOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [walletOpen])

  async function handleLogout() {
    setUserOpen(false)
    try {
      await logout()
    } catch (error: unknown) {
      console.error("Logout failed", error)
    } finally {
      // Redirect to the correct login page based on role
      navigate(isSuperAdmin ? "/admin/login" : "/login", { replace: true })
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
        {!isSuperAdmin && (
          <div ref={walletRef} className="relative">
            <button
              type="button"
              onClick={() => setWalletOpen((open) => !open)}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-2.5 text-left shadow-sm transition-colors hover:border-gray-300 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none sm:px-3"
              aria-label="অ্যাকাউন্ট ব্যালেন্স অপশন"
              aria-haspopup="menu"
              aria-expanded={walletOpen}
            >
              <Wallet className="size-4 shrink-0 text-emerald-600" />
              <span>
                {/* <span className="hidden text-[10px] leading-none text-gray-500 sm:block">
                  Wallet balance
                </span> */}
                <span className="text-xs font-semibold text-gray-800 tabular-nums sm:text-sm">
                  ৳ 0.00
                </span>
              </span>
              <ChevronDown
                className={`size-3.5 shrink-0 text-gray-400 transition-transform ${walletOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {walletOpen ? (
              <div
                className="absolute top-full right-0 z-30 mt-2 w-fit"
                role="menu"
                aria-label="Wallet options"
              >
                <div className="rounded-md border border-gray-200 bg-white p-1.5 shadow-lg">
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-fit items-center gap-1 rounded-md px-1 py-1 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700 focus-visible:bg-emerald-50 focus-visible:outline-none"
                    onClick={() => {
                      setWalletOpen(false)
                      navigate("/shop/recharge")
                    }}
                  >
                    <Plus className="icon-size text-emerald-600" />

                    <span className="whitespace-nowrap">Add Balance</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}
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
                  navigate(profilePath)
                }}
              >
                Profile
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
  menu,
  brandLabel,
}: {
  open: boolean
  onClose: () => void
  menu: MenuItem[]
  brandLabel: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="admin-sidebar-shell absolute top-0 left-0 flex h-full flex-col">
        <div className="admin-sidebar-brand flex h-14 items-center justify-between px-4">
          <div className="text-lg font-semibold">{brandLabel}</div>
          <button type="button" onClick={onClose} aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <Sidebar menu={menu} />
      </div>
    </div>
  )
}
