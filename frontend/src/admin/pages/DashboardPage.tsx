import { useEffect, useState } from "react"
import { Link } from "react-router"
import { StatusBadge } from "../components/common/StatusBadge"
import { formatTaka } from "../lib/orderStatus"
import { Plus, RefreshCw } from "lucide-react"

export type PendingOrderItem = {
  id: string
  orderNumber: string
  placedTime: string
  customerName: string
  customerPhone: string
  deliveryArea: string
  itemSummary: string
}

export type DashboardData = {
  metrics: {
    newOrdersToday: {
      count: number
      change: string
      cod: number
      bKash: number
    }
    waitingConfirmation: { count: number; oldestTime: string }
    deliveredRevenueMonth: {
      amount: number
      parcelCount: number
      avgPerOrder: number
    }
    lowStockProducts: { count: number; alertText: string }
  }
  pendingVerificationOrders: PendingOrderItem[]
  weeklyChart: {
    days: { day: string; count: number; active?: boolean }[]
    totalOrders: number
    totalValue: number
    dailyAverage: number
    dateRange: string
  }
  courierSummary: {
    provider: string
    manifestPrinted: boolean
    readyForPickup: number
    pickupTime: string
    insideDhaka: number
    outsideDhaka: number
    totalCod: number
    manifestId: string
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulating API response matching the exact design image
    setTimeout(() => {
      setData({
        metrics: {
          newOrdersToday: {
            count: 7,
            change: "+2 vs yesterday",
            cod: 5,
            bKash: 2,
          },
          waitingConfirmation: {
            count: 12,
            oldestTime: "Oldest pending 4h ago • Needs call verification",
          },
          deliveredRevenueMonth: {
            amount: 182400,
            parcelCount: 114,
            avgPerOrder: 1600,
          },
          lowStockProducts: {
            count: 1,
            alertText: "JINGSENG PLUS (28 left at Tejgaon hub)",
          },
        },
        pendingVerificationOrders: [
          {
            id: "1",
            orderNumber: "#PZ-10488",
            placedTime: "45m ago",
            customerName: "Rahim Uddin",
            customerPhone: "+880 1819-482910",
            deliveryArea: "Inside Dhaka (Dhanmondi)",
            itemSummary: "Ultra Hot × 1",
          },
          {
            id: "2",
            orderNumber: "#PZ-10487",
            placedTime: "1h 20m ago",
            customerName: "Nusrat Jahan",
            customerPhone: "+880 1711-928374",
            deliveryArea: "Outside Dhaka (Chittagong)",
            itemSummary: "JINGSENG PLUS × 2",
          },
          {
            id: "3",
            orderNumber: "#PZ-10482",
            placedTime: "2h 10m ago",
            customerName: "Mahmudul Hasan",
            customerPhone: "+880 1971-234567",
            deliveryArea: "Inside Dhaka (Gulshan-1)",
            itemSummary: "Ultra Hot × 1",
          },
          {
            id: "4",
            orderNumber: "#PZ-10480",
            placedTime: "3h 05m ago",
            customerName: "Kazi Faruk",
            customerPhone: "+880 1622-554411",
            deliveryArea: "Inside Dhaka (Mirpur-10)",
            itemSummary: "Ling Long × 1",
          },
          {
            id: "5",
            orderNumber: "#PZ-10479",
            placedTime: "4h 15m ago",
            customerName: "Sharmin Akter",
            customerPhone: "+880 1715-998822",
            deliveryArea: "Outside Dhaka (Sylhet)",
            itemSummary: "Ultra Hot × 2",
          },
        ],
        weeklyChart: {
          days: [
            { day: "Thu", count: 14 },
            { day: "Fri", count: 18 },
            { day: "Sat", count: 22 },
            { day: "Sun", count: 16 },
            { day: "Mon", count: 25 },
            { day: "Tue", count: 19 },
            { day: "Today", count: 14, active: true },
          ],
          totalOrders: 128,
          totalValue: 198600,
          dailyAverage: 18.3,
          dateRange: "24-30 Oct",
        },
        courierSummary: {
          provider: "Steadfast Courier",
          manifestPrinted: true,
          readyForPickup: 14,
          pickupTime: "Pickup scheduled today at 04:30 PM",
          insideDhaka: 9,
          outsideDhaka: 5,
          totalCod: 23450,
          manifestId: "#MF-241030-01",
        },
      })
      setLoading(false)
    }, 300)
  }, [])

  if (loading || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-sm text-[var(--text-muted)]">
        Loading dashboard…
      </div>
    )
  }

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-6">
      {/* Top Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Dashboard
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600"></span>
              Live Operations
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Real-time orders, telephone verification queue, and fulfillment
            overview across Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="admin-template-button admin-template-button--secondary text-xs">
            📅 Today: 30 Oct 2024
          </div>
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary"
          >
            <RefreshCw className="icon-size" /> Refresh Refresh
          </button>
          <Link
            to="/admin/orders/new"
            className="admin-template-button admin-template-button--primary"
          >
            <Plus className="icon-size" /> Create Order
          </Link>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="admin-dashboard-card flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              New orders today
            </span>
            <span className="text-[var(--text-muted)]">🛍️</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {data.metrics.newOrdersToday.count}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {data.metrics.newOrdersToday.change} •{" "}
            {data.metrics.newOrdersToday.cod} COD,{" "}
            {data.metrics.newOrdersToday.bKash} bKash
          </div>
        </div>

        {/* Card 2 */}
        <div className="admin-dashboard-card flex flex-col justify-between border-l-4 border-l-amber-500 bg-amber-50/20 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Waiting for confirmation
            </span>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 uppercase">
              Requires Action
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-700 tabular-nums">
            {data.metrics.waitingConfirmation.count}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {data.metrics.waitingConfirmation.oldestTime}
          </div>
        </div>

        {/* Card 3 */}
        <div className="admin-dashboard-card flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Delivered revenue (Month)
            </span>
            <span className="text-[var(--text-muted)]">📈</span>
          </div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
            {formatTaka(data.metrics.deliveredRevenueMonth.amount)}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {data.metrics.deliveredRevenueMonth.parcelCount} delivered parcels •
            Avg. {formatTaka(data.metrics.deliveredRevenueMonth.avgPerOrder)}
            /order
          </div>
        </div>

        {/* Card 4 */}
        <div className="admin-dashboard-card flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Low-stock products
            </span>
            <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800 uppercase">
              1 SKU Alert
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-red-600 tabular-nums">
            {data.metrics.lowStockProducts.count}
          </div>
          <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
            {data.metrics.lowStockProducts.alertText}
          </div>
        </div>
      </div>

      {/* Main Grid Layout (Left: Pending Table, Right: Chart & Courier Widgets) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Section: Needs Attention Table (8 Columns) */}
        <div className="space-y-4 lg:col-span-8">
          <div className="admin-dashboard-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-table-header)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  Needs attention — Pending phone verification
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  5 urgent
                </span>
              </div>
              <Link
                to="/admin/orders?status=pending"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                View all 12 pending orders →
              </Link>
            </div>
            <div className="border-b border-[var(--border-light)] bg-amber-50/50 px-4 py-2 text-xs text-[var(--text-muted)]">
              5 oldest pending cash-on-delivery orders awaiting customer
              confirmation call
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-[var(--border-light)] bg-[var(--bg-table-header)] text-xs font-semibold text-[var(--text-muted)] uppercase">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Placed</th>
                    <th className="px-4 py-3">Customer / Phone</th>
                    <th className="px-4 py-3">Delivery Area</th>
                    <th className="px-4 py-3">Items</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {data.pendingVerificationOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="transition-colors hover:bg-[var(--bg-surface-hover)]"
                    >
                      <td className="px-4 py-3 font-medium text-[var(--primary)]">
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] tabular-nums">
                        {order.placedTime}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)]">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] tabular-nums">
                          {order.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-[var(--status-confirmed-bg)] px-2 py-1 text-xs font-medium text-[var(--status-confirmed-text)]">
                          {order.deliveryArea}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                        {order.itemSummary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-light)] bg-[var(--bg-table-header)] px-4 py-3 text-xs text-[var(--text-muted)]">
              <span>
                ● All items held from dispatch until phone verification
                completed
              </span>
              <span className="font-medium">
                Operator SLA Target: &lt; 30 mins
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Analytics & Courier Widgets (4 Columns) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Orders in last 7 days Chart Widget */}
          <div className="admin-dashboard-card space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Orders in last 7 days
                </h3>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  {data.weeklyChart.totalOrders} orders total •{" "}
                  {formatTaka(data.weeklyChart.totalValue)} value
                </p>
              </div>
              <span className="text-xs font-medium text-[var(--text-muted)]">
                {data.weeklyChart.dateRange}
              </span>
            </div>

            {/* Custom CSS Bar Chart Simulation */}
            <div className="flex h-32 items-end justify-between gap-2 border-b border-[var(--border-light)] pt-6 pb-2">
              {data.weeklyChart.days.map((item) => {
                const heightPercent = Math.round((item.count / 25) * 100)
                return (
                  <div
                    key={item.day}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] text-[var(--text-muted)] tabular-nums opacity-0 transition-opacity group-hover:opacity-100">
                      {item.count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all ${
                        item.active
                          ? "bg-[var(--primary)]"
                          : "bg-[var(--border-light)] hover:bg-[var(--primary-hover)]"
                      }`}
                    ></div>
                    <span className="text-[11px] font-medium text-[var(--text-muted)]">
                      {item.day}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-1 text-xs text-[var(--text-muted)]">
              <span>Daily volume average</span>
              <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                {data.weeklyChart.dailyAverage} orders/day
              </span>
            </div>
          </div>

          {/* Steadfast Courier Widget */}
          <div className="admin-dashboard-card space-y-4 p-4">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-emerald-100 text-xs font-bold text-emerald-800">
                  🚚
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {data.courierSummary.provider}
                </span>
              </div>
              <StatusBadge variant="delivered" label="Manifest Printed" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--border-light)] bg-[var(--bg-table-header)] p-3">
              <div>
                <div className="text-xs font-bold text-[var(--text-muted)] uppercase">
                  Ready for Pickup
                </div>
                <div className="mt-0.5 text-xl font-bold text-[var(--text-primary)] tabular-nums">
                  {data.courierSummary.readyForPickup} Parcels
                </div>
              </div>
              <div className="max-w-[140px] text-right text-xs text-[var(--text-muted)]">
                {data.courierSummary.pickupTime}
              </div>
            </div>

            <div className="space-y-2 divide-y divide-[var(--border-light)] text-xs text-[var(--text-muted)]">
              <div className="flex justify-between pt-1">
                <span>Inside Dhaka (Next Day):</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {data.courierSummary.insideDhaka} parcels
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span>Outside Dhaka (48-72h):</span>
                <span className="font-semibold text-[var(--text-primary)] tabular-nums">
                  {data.courierSummary.outsideDhaka} parcels
                </span>
              </div>
              <div className="flex justify-between pt-2 font-medium">
                <span>Total COD Collection:</span>
                <span className="font-semibold text-[var(--primary)] tabular-nums">
                  {formatTaka(data.courierSummary.totalCod)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border-light)] pt-2">
              <button
                type="button"
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                Generate Courier Manifest
              </button>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                {data.courierSummary.manifestId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
