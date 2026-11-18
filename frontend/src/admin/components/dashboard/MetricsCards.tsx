import { HandCoins, PackageCheck, ShoppingBag, TrendingUp } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import { DashboardMetricCard } from "./DashboardMetricCard"
import type { DashboardData } from "../../types/dashboard"

export function MetricsCards({ dashboard }: { dashboard: DashboardData }) {
  const { metrics, weeklyChart, courierSummary } = dashboard

  return (
    <section aria-label="Store performance metrics" className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-(--text-primary)">
          Store performance
        </h2>
        <p className="text-xs text-(--text-muted)">
          Today&apos;s activity, fulfillment and recent sales
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardMetricCard
          label="New orders today"
          value={metrics.newOrdersToday.count}
          subText={`${metrics.newOrdersToday.change} • ${metrics.newOrdersToday.cod} COD, ${metrics.newOrdersToday.bkash} other`}
          icon={<ShoppingBag className="icon-size!" />}
          badge={
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-(--text-muted)">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              COD {metrics.newOrdersToday.cod}
              <span className="size-1.5 rounded-full bg-blue-500" />
              Digital {metrics.newOrdersToday.bkash}
            </span>
          }
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
          label="Orders · last 7 days"
          value={weeklyChart.totalOrders}
          subText={`${weeklyChart.dailyAverage} orders/day • ${formatTaka(weeklyChart.totalValue)} order value`}
          icon={<TrendingUp className="icon-size!" />}
        />
        <DashboardMetricCard
          label="Ready for pickup"
          value={courierSummary.readyForPickup}
          subText={`${courierSummary.insideDhaka} inside • ${courierSummary.outsideDhaka} outside Dhaka`}
          icon={<PackageCheck className="icon-size!" />}
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
    </section>
  )
}
