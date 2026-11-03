import { NavLink } from "react-router"
import { adminMenu, type MenuItem } from "../menu"

export function Sidebar() {
  return (
    <nav className="h-full overflow-y-auto bg-(--bg-surface) px-2 py-2">
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
            return (
              <li key={item.label}>
                <NavLink
                  to={item.href}
                  end
                  className={({ isActive }) =>
                    `flex items-center justify-between rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary font-semibold text-white"
                        : "text-(--text-primary) hover:bg-(--bg-surface-hover)"
                    }`
                  }
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-(--status-pending-bg) px-2 py-0.5 text-xs font-semibold text-(--status-pending-text)">
                      {item.badge}
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
