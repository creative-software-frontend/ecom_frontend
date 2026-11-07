import { NavLink, useLocation } from "react-router"
import { adminMenu, type MenuItem } from "../menu"
import { useSidebarStats } from "../../hooks/useSidebarStats"

export function Sidebar() {
  const { pendingOrders, totalProducts } = useSidebarStats()
  const location = useLocation()
  const currentPath = location.pathname
  // ব্যাজ ভ্যালু রিজলভ করার হেল্পার
  // ১. href === "/admin/orders" হলে pendingOrders
  // ২. href === "/admin/products" হলে totalProducts
  // ৩. নাহলে item.badge (স্ট্যাটিক) থাকলে সেটা
  const resolveBadge = (item: MenuItem): string | number | undefined => {
    if (item.type !== "link") return undefined
    if (item.href === "/admin/orders" && pendingOrders > 0) {
      return pendingOrders
    }
    if (item.href === "/admin/products" && totalProducts > 0) {
      return totalProducts
    }
    return item.badge
  }

  // ব্যাজের স্টাইল — Orders হলে alert (amber), বাকিরা neutral
  const isAlertBadge = (item: MenuItem): boolean => {
    return item.type === "link" && item.href === "/admin/orders"
  }

  return (
    <nav className="h-dvh overflow-y-auto bg-(--bg-surface) px-2 py-2">
      <ul className="space-y-1">
        {adminMenu.map((item: MenuItem, index: number) => {
          if (item.type === "section") {
            return (
              <li key={`section-${index}`} className="px-3 pt-4 pb-2">
                <span className="text-[11px] font-bold tracking-wider text-(--text-muted) uppercase">
                  {item.label}
                </span>
              </li>
            )
          }

          if (item.type === "link" && item.href) {
            let isActive = false
            if (item.href === "/admin") {
              isActive = currentPath === "/admin" || currentPath === "/admin/"
            } else {
              isActive =
                currentPath.includes(item.href) ||
                currentPath.startsWith(item.href)
            }
            const badge = resolveBadge(item)
            const isAlert = isAlertBadge(item)

            return (
              <li key={item.label}>
                <NavLink
                  to={item.href}
                  end
                  className={`flex items-center justify-between rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary font-semibold text-white"
                      : "text-(--text-primary) hover:bg-(--bg-surface-hover)"
                  }`}
                >
                  <span>{item.label}</span>
                  {badge !== undefined && badge !== 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                        isAlert
                          ? "bg-(--status-pending-bg) text-(--status-pending-text)"
                          : "bg-(--bg-table-header) text-(--text-muted)"
                      }`}
                    >
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
