import { Trophy } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import type { TopShopSummary } from "../../data/shopSummaryMock"

const statusConfig: Record<
  TopShopSummary["status"],
  { label: string; className: string }
> = {
  active: {
    label: "Active",
    className: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
  },
  trial: {
    label: "Trial",
    className: "bg-(--status-pending-bg) text-(--status-pending-text)",
  },
  inactive: {
    label: "Suspended",
    className: "bg-(--status-cancelled-bg) text-(--status-cancelled-text)",
  },
}

export function TopShopsCard({ shops }: { shops: TopShopSummary[] }) {
  const ranked = [...shops].sort((a, b) => b.salesToday - a.salesToday)
  const maxSales = Math.max(...shops.map((s) => s.salesToday), 1)

  return (
    <div className="rounded-md border border-(--border-light) bg-(--bg-surface) p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">
            Top Shops by Sales
          </h3>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Highest revenue today across all tenants
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-(--primary-soft) bg-(--primary-soft) px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary">
          <Trophy className="size-3" /> Top {ranked.length}
        </span>
      </div>

      {ranked.length === 0 ? (
        <p className="py-10 text-center text-xs text-(--text-muted)">
          No shop sales recorded today.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {ranked.map((shop, index) => {
            const cfg = statusConfig[shop.status] ?? statusConfig.inactive
            return (
              <li key={shop.id} className="flex items-center gap-3">
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${
                    index === 0
                      ? "bg-primary text-white"
                      : "bg-(--bg-table-header) text-(--text-muted)"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-xs font-semibold text-(--text-primary)">
                        {shop.name}
                      </p>
                      <span
                        className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.className}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-(--text-primary) tabular-nums">
                      {formatTaka(shop.salesToday)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-(--text-muted)">
                    <span className="truncate">{shop.slug}.powerzenox.com</span>
                    <span className="shrink-0 tabular-nums">
                      {shop.ordersToday} orders
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(shop.salesToday / maxSales) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
