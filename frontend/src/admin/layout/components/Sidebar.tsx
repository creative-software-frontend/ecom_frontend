import { NavLink } from "react-router"
import type { MenuItem } from "../menu"
import { useSidebarStats } from "@/admin/hooks/useSidebarStats"

export function Sidebar({ menu }: { menu: MenuItem[] }) {
  const { data: stats } = useSidebarStats()

  /**
   * Resolve a badge count for a menu item. Returns the dynamic stat
   * when available, else falls back to whatever static badge the menu
   * declared (usually undefined).
   *
   * Only returns 0 or undefined for items with no badge — the render
   * block below skips rendering when the value is 0.
   */
  const getBadge = (item: MenuItem): string | number | undefined => {
    if (item.type !== "link") return undefined

    // ----- Shop admin badges -----
    if (item.href === "/shop/orders" && stats?.pendingOrders !== undefined) {
      return stats.pendingOrders
    }
    if (item.href === "/shop/products" && stats?.totalProducts !== undefined) {
      return stats.totalProducts
    }

    // ----- Super admin badges -----
    if (item.href === "/admin/users" && stats?.totalUsers !== undefined) {
      return stats.totalUsers
    }
    if (item.href === "/admin/shops" && stats?.totalShops !== undefined) {
      return stats.totalShops
    }
    // Roles / Audit intentionally have no badge — total counts are less
    // actionable there and would clutter the sidebar.

    // Fallback to whatever the menu declared statically.
    return item.badge
  }

  return (
    <nav className="h-full overflow-y-auto bg-(--bg-surface) px-2 py-2">
      <ul className="space-y-1">
        {menu.map((item: MenuItem, index: number) => {
          if (item.type === "section") {
            return (
              <li key={`section-${index}`} className="px-3 pt-4 pb-2">
                <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
                  {item.label}
                </span>
              </li>
            )
          }

          if (item.type === "link" && item.href) {
            if (item.disabled) {
              return (
                <li key={item.label}>
                  <div className="cursor-not-allowed rounded-sm px-3 py-2 text-sm font-medium text-(--text-muted) opacity-50">
                    {item.label}
                  </div>
                </li>
              )
            }

            const badge = getBadge(item)
            // Hide empty/zero badges — a "0" badge is noise, not signal.
            const showBadge =
              badge !== undefined &&
              badge !== null &&
              badge !== 0 &&
              badge !== ""

            return (
              <li key={item.label}>
                <NavLink
                  to={item.href}
                  end={false}
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary font-semibold text-white"
                        : "text-(--text-primary) hover:bg-(--bg-surface-hover)"
                    }`
                  }
                >
                  <span>{item.label}</span>
                  {showBadge && (
                    <span className="rounded-full bg-(--status-pending-bg) px-2 py-0.5 text-xs font-semibold text-(--status-pending-text)">
                      {badge}
                    </span>
                  )}
                </NavLink>
              </li>
            )
          }

          return null
        })}
      </ul>
    </nav>
  )
}

export default Sidebar
