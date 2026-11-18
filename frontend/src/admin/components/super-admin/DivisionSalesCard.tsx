import { TrendingUp } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import type { DivisionSummary } from "../../data/shopSummaryMock"

export function DivisionSalesCard({
  divisions,
}: {
  divisions: DivisionSummary[]
}) {
  const ranked = [...divisions].sort((a, b) => b.salesToday - a.salesToday)
  const totalSales = divisions.reduce((sum, d) => sum + d.salesToday, 0)
  const totalOrders = divisions.reduce((sum, d) => sum + d.ordersToday, 0)
  const maxSales = Math.max(...divisions.map((d) => d.salesToday), 1)

  return (
    <div className="flex flex-col justify-between rounded-md border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Today&apos;s Sales by Division
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Revenue collected so far today, per division
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-(--primary-soft) bg-(--primary-soft) px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-primary">
            <TrendingUp className="size-3" /> {formatTaka(totalSales)}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {ranked.length === 0 ? (
            <p className="py-6 text-center text-xs text-(--text-muted)">
              No sales recorded today.
            </p>
          ) : (
            ranked.map((item) => (
              <div key={item.division}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-(--text-primary)">
                    {item.division}
                  </span>
                  <span className="text-(--text-muted) tabular-nums">
                    {formatTaka(item.salesToday)}
                    <span className="ml-1 text-[10px]">
                      · {item.ordersToday} orders
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(item.salesToday / maxSales) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-(--border-light) pt-3 text-xs text-(--text-muted)">
        <span>{totalOrders} orders today</span>
        <span className="font-medium text-(--text-primary)">
          Top: {ranked[0]?.division ?? "—"}
        </span>
      </div>
    </div>
  )
}
