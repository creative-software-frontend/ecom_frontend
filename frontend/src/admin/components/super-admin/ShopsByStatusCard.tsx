import { Store } from "lucide-react"
import type { SuperAdminDashboardData } from "../../types/superAdmin"

const statusConfig: Record<string, { label: string; badgeClass: string }> = {
  active: {
    label: "Active",
    badgeClass: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-(--bg-table-header) text-(--text-muted)",
  },
  trial: {
    label: "Trial",
    badgeClass: "bg-(--status-pending-bg) text-(--status-pending-text)",
  },
  expired: {
    label: "Expired",
    badgeClass: "bg-(--status-cancelled-bg) text-(--status-cancelled-text)",
  },
}

export function ShopsByStatusCard({
  shopsByStatus,
  trialExpiringSoon,
}: {
  shopsByStatus: SuperAdminDashboardData["shopsByStatus"]
  trialExpiringSoon: SuperAdminDashboardData["trialExpiringSoon"]
}) {
  return (
    <section className="space-y-3 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <header className="flex items-center gap-2 border-b border-(--border-light) pb-2">
        <span className="flex size-6 items-center justify-center rounded bg-(--primary-soft) text-primary">
          <Store className="size-3.5" />
        </span>
        <h3 className="text-sm font-semibold text-(--text-primary)">
          Shops by status
        </h3>
      </header>
      {shopsByStatus.length === 0 ? (
        <p className="py-4 text-center text-xs text-(--text-muted)">
          No shops yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {shopsByStatus.map((s) => {
            const cfg = statusConfig[s.status] ?? {
              label: s.status,
              badgeClass: "bg-(--bg-table-header) text-(--text-muted)",
            }
            return (
              <li
                key={s.status}
                className="flex items-center justify-between gap-2"
              >
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cfg.badgeClass}`}
                >
                  {cfg.label}
                </span>
                <span className="text-sm font-semibold text-(--text-primary) tabular-nums">
                  {s.count}
                </span>
              </li>
            )
          })}
        </ul>
      )}
      {trialExpiringSoon.length > 0 && (
        <div className="rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2">
          <p className="text-xs font-medium text-(--status-pending-text)">
            ⚠️ {trialExpiringSoon.length} trial
            {trialExpiringSoon.length === 1 ? "" : "s"} expiring within 7 days
          </p>
        </div>
      )}
    </section>
  )
}
