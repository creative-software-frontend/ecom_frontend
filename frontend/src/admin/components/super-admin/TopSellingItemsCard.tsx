import { Flame } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import type { TopSellingItem } from "../../types/superAdmin"

export function TopSellingItemsCard({ items }: { items: TopSellingItem[] }) {
  const maxUnits = Math.max(...items.map((i) => i.unitsSold), 1)
  const totalUnits = items.reduce((sum, i) => sum + i.unitsSold, 0)

  return (
    <div className="flex flex-col justify-between rounded-md border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Top Selling Items
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Best performing products across all shops
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-700">
            <Flame className="size-3" /> {totalUnits.toLocaleString("en-BD")}{" "}
            sold
          </span>
        </div>

        <ol className="mt-6 space-y-4">
          {items.length === 0 ? (
            <p className="py-6 text-center text-xs text-(--text-muted)">
              No sales data yet.
            </p>
          ) : (
            items.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-(--bg-table-header) text-[11px] font-bold text-(--text-muted) tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-(--text-primary)">
                      {item.name}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-(--text-primary) tabular-nums">
                      {formatTaka(item.revenue)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-(--text-muted)">
                    <span className="truncate">{item.category}</span>
                    <span className="shrink-0 tabular-nums">
                      {item.unitsSold} units
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(item.unitsSold / maxUnits) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))
          )}
        </ol>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-(--border-light) pt-3 text-xs text-(--text-muted)">
        <span>Ranked by units sold</span>
        <span className="font-medium text-(--text-primary)">
          Top: {items[0]?.name ?? "—"}
        </span>
      </div>
    </div>
  )
}
