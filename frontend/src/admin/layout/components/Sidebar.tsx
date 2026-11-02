import { NavLink } from "react-router"
import { adminMenu, type MenuItem } from "../menu"

export function Sidebar() {
  return (
    <nav className="h-full overflow-y-auto border-r border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-4">
      <div className="mb-6 px-3">
        <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
          Power Zenox
        </span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">
          Store Admin • BD
        </h2>
      </div>

      <ul className="space-y-1">
        {adminMenu.map((item: MenuItem, index: number) => {
          if (item.type === "section") {
            return (
              <li key={`section-${index}`} className="px-3 pt-4 pb-2">
                <span className="text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase">
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
                    `flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
                    }`
                  }
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="rounded-full bg-[var(--status-pending-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--status-pending-text)]">
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
