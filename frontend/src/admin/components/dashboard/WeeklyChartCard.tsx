import { formatTaka } from "../../lib/orderStatus"
import type { DashboardData } from "../../types/dashboard"

export function WeeklyChartCard({
  chart,
}: {
  chart: DashboardData["weeklyChart"]
}) {
  const maxCount = Math.max(...chart.days.map((d) => d.count), 1)

  return (
    <div className="space-y-4 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">
            Orders in last 7 days
          </h3>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            {chart.totalOrders} orders • {formatTaka(chart.totalValue)} value
          </p>
        </div>
        <span className="text-xs font-medium text-(--text-muted)">
          {chart.dateRange}
        </span>
      </div>

      <div className="flex h-32 items-end justify-between gap-2 border-b border-(--border-light) pt-6 pb-2">
        {chart.days.map((item) => {
          const heightPercent =
            item.count > 0 ? Math.max(8, (item.count / maxCount) * 100) : 4
          return (
            <div
              key={item.day}
              className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${item.day}: ${item.count} orders`}
            >
              <span className="text-[10px] text-(--text-muted) tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                {item.count}
              </span>
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t transition-all ${
                  item.active
                    ? "bg-primary"
                    : "bg-(--border-light) hover:bg-(--primary-hover)"
                }`}
              />
              <span className="text-[11px] font-medium text-(--text-muted)">
                {item.day}
              </span>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-(--text-muted)">
        <span>Daily volume average</span>
        <span className="font-semibold text-(--text-primary) tabular-nums">
          {chart.dailyAverage} orders/day
        </span>
      </div>
    </div>
  )
}
