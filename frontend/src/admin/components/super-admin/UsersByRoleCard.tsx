import { Users } from "lucide-react"
import type { SuperAdminDashboardData } from "../../types/superAdmin"

const roleBadgeClass: Record<string, string> = {
  super_admin: "bg-(--primary-soft) text-(--primary)",
  platform_manager: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  shop_admin: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  salesman: "bg-(--bg-table-header) text-(--text-muted)",
  order_handler: "bg-(--status-shipped-bg) text-(--status-shipped-text)",
  product_uploader: "bg-(--status-pending-bg) text-(--status-pending-text)",
}

export function UsersByRoleCard({
  usersByRole,
}: {
  usersByRole: SuperAdminDashboardData["usersByRole"]
}) {
  return (
    <section className="space-y-3 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <header className="flex items-center gap-2 border-b border-(--border-light) pb-2">
        <span className="flex size-6 items-center justify-center rounded bg-(--primary-soft) text-(--primary)">
          <Users className="size-3.5" />
        </span>
        <h3 className="text-sm font-semibold text-(--text-primary)">
          Users by role
        </h3>
      </header>
      {usersByRole.length === 0 ? (
        <p className="py-4 text-center text-xs text-(--text-muted)">
          No users yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {usersByRole.map((r) => (
            <li
              key={r.roleId}
              className="flex items-center justify-between gap-2"
            >
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${
                  roleBadgeClass[r.roleName] ??
                  "bg-(--bg-table-header) text-(--text-muted)"
                }`}
              >
                {r.roleDisplayName}
              </span>
              <span className="text-[13px] font-semibold text-(--text-primary) tabular-nums">
                {r.count}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
