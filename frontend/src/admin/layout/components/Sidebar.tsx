import { ChevronDown } from "lucide-react"
import { useState } from "react"
import { NavLink } from "react-router"
import { adminMenu } from "../menu"

export function Sidebar() {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Dashboards: true,
  })

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <nav className="h-full overflow-y-auto admin-sidebar-nav">
      <div className="px-6 py-3 admin-sidebar-section-label tracking-wide uppercase">
        Menu
      </div>
      <ul className="space-y-1 px-2">
        {adminMenu.map((item) => {
          if (item.type === "group") {
            const isOpen = openGroups[item.label] ?? false
            return (
              <li key={item.label}>
                <button
                  type="button"
                  className="admin-sidebar-group-toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggleGroup(item.label)}
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4 admin-sidebar-state-icon" />
                </button>
                {isOpen && item.items ? (
                  <ul className="admin-sidebar-group-children space-y-1">
                    {item.items.map((child) => (
                      <li key={child.label}>
                        {child.type === "link" && child.href ? (
                          <NavLink
                            to={child.href}
                            end
                            className={({ isActive }) =>
                              `admin-sidebar-link ${isActive ? "admin-sidebar-link--active" : ""}`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ) : (
                          <div
                            className="admin-sidebar-disabled"
                            title="Coming soon"
                          >
                            {child.label}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          }
          if (item.type === "disabled") {
            return (
              <li key={item.label}>
                <div className="admin-sidebar-disabled" title="Coming soon">
                  {item.label}
                </div>
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
                    `admin-sidebar-link ${isActive ? "admin-sidebar-link--active" : ""}`
                  }
                >
                  {item.label}
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
