import { HandCoins, ShoppingBag } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import type { DashboardData } from "../../types/dashboard"

export function MetricsCards({
  metrics,
}: {
  metrics: DashboardData["metrics"]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* New orders today */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
            New orders today
          </span>
          <ShoppingBag className="icon-size! text-(--text-muted)" />
        </div>
        <div className="mt-2 text-2xl font-bold text-(--text-primary) tabular-nums">
          {metrics.newOrdersToday.count}
        </div>
        <div className="mt-1 text-xs text-(--text-muted)">
          {metrics.newOrdersToday.change} • {metrics.newOrdersToday.cod} COD,{" "}
          {metrics.newOrdersToday.bkash} other
        </div>
      </div>

      {/* Waiting confirmation */}
      <div className="rounded-lg border border-l-4 border-(--border-light) border-l-amber-500 bg-amber-50/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
            Waiting confirmation
          </span>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-amber-800 uppercase">
            Action needed
          </span>
        </div>
        <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
          {metrics.waitingConfirmation.count}
        </div>
        <div className="mt-1 text-xs text-(--text-muted)">
          {metrics.waitingConfirmation.oldestTime}
        </div>
      </div>

      {/* Delivered revenue */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
            Delivered revenue (month)
          </span>
          <HandCoins className="icon-size! text-(--text-muted)" />
        </div>
        <div className="mt-2 text-2xl font-bold text-(--text-primary) tabular-nums">
          {formatTaka(metrics.deliveredRevenueMonth.amount)}
        </div>
        <div className="mt-1 text-xs text-(--text-muted)">
          {metrics.deliveredRevenueMonth.parcelCount} delivered • Avg.{" "}
          {formatTaka(metrics.deliveredRevenueMonth.avgPerOrder)}/order
        </div>
      </div>

      {/* Low stock */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
            Low-stock products
          </span>
          {metrics.lowStockProducts.count > 0 && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
              {metrics.lowStockProducts.count} SKU
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-bold text-red-600 tabular-nums">
          {metrics.lowStockProducts.count}
        </div>
        <div className="mt-1 truncate text-xs text-(--text-muted)">
          {metrics.lowStockProducts.alertText}
        </div>
      </div>
    </div>
  )
}
