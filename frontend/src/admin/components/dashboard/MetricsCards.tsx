import { HandCoins, ShoppingBag } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import { DashboardMetricCard } from "./DashboardMetricCard"
import type { DashboardData } from "../../types/dashboard"

export function MetricsCards({
  metrics,
}: {
  metrics: DashboardData["metrics"]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="New orders today"
        value={metrics.newOrdersToday.count}
        subText={`${metrics.newOrdersToday.change} • ${metrics.newOrdersToday.cod} COD, ${metrics.newOrdersToday.bkash} other`}
        icon={<ShoppingBag className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Waiting confirmation"
        value={metrics.waitingConfirmation.count}
        subText={metrics.waitingConfirmation.oldestTime}
        subTextClassName="truncate"
        variant="warning"
        badge={
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold whitespace-nowrap text-amber-800 uppercase">
            Action needed
          </span>
        }
      />
      <DashboardMetricCard
        label="Delivered revenue (month)"
        value={formatTaka(metrics.deliveredRevenueMonth.amount)}
        subText={`${metrics.deliveredRevenueMonth.parcelCount} delivered • Avg. ${formatTaka(metrics.deliveredRevenueMonth.avgPerOrder)}/order`}
        icon={<HandCoins className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Low-stock products"
        value={metrics.lowStockProducts.count}
        subText={metrics.lowStockProducts.alertText}
        subTextClassName="truncate"
        variant="danger"
        badge={
          metrics.lowStockProducts.count > 0 ? (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 uppercase">
              {metrics.lowStockProducts.count} SKU
            </span>
          ) : null
        }
      />
    </div>
  )
}
