import { ArrowRight, Package, ShoppingCart, TriangleAlert } from "lucide-react"
import { Link } from "react-router"
import type {
  SuperAdminCommerceAnalytics as CommerceData,
  ShopSummaryData,
} from "../../types/superAdmin"
import { formatTaka } from "../../lib/orderStatus"
import { TopSellingItemsCard } from "./TopSellingItemsCard"
import { TopShopsCard } from "./TopShopsCard"

const ORDER_STAGES = [
  { status: "pending", label: "Pending", color: "bg-amber-500" },
  { status: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { status: "shipped", label: "Shipped", color: "bg-indigo-500" },
  { status: "delivered", label: "Delivered", color: "bg-emerald-500" },
  { status: "returned", label: "Returned", color: "bg-orange-500" },
  { status: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const

export function SuperAdminCommerceAnalytics({
  commerce,
  shopSummary,
}: {
  commerce: CommerceData
  shopSummary: ShopSummaryData
}) {
  const { orderPipeline, productHealth } = commerce

  return (
    <section aria-labelledby="commerce-analytics-heading" className="space-y-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="commerce-analytics-heading"
            className="text-base font-semibold text-(--text-primary)"
          >
            Commerce analytics
          </h2>
          <p className="text-xs text-(--text-muted)">
            Live orders, products and sales performance across shops
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                <ShoppingCart className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-(--text-primary)">
                  Order pipeline
                </h3>
                <p className="text-xs text-(--text-muted)">
                  {orderPipeline.totalOrders.toLocaleString("en-BD")} orders
                  across all shops
                </p>
              </div>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Orders <ArrowRight className="size-3.5" />
            </Link>
          </header>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-md bg-(--bg-app) p-2.5">
              <p className="text-[11px] text-(--text-muted)">Order value</p>
              <p className="mt-1 text-sm font-bold text-(--text-primary) tabular-nums">
                {formatTaka(orderPipeline.orderValue)}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-2.5">
              <p className="text-[11px] text-(--text-muted)">Unpaid amount</p>
              <p className="mt-1 text-sm font-bold text-amber-700 tabular-nums">
                {formatTaka(orderPipeline.unpaidAmount)}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-2.5">
              <p className="text-[11px] text-(--text-muted)">
                Est. gross profit
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-700 tabular-nums">
                {formatTaka(orderPipeline.estimatedProfit)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {ORDER_STAGES.map((stage) => {
              const count = orderPipeline.countsByStatus[stage.status]
              const percent =
                orderPipeline.totalOrders > 0
                  ? (count / orderPipeline.totalOrders) * 100
                  : 0

              return (
                <div key={stage.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-(--text-muted)">{stage.label}</span>
                    <span className="font-semibold text-(--text-primary) tabular-nums">
                      {count}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-(--bg-surface-hover)">
                    <div
                      className={`h-full rounded-full ${stage.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[10px] text-(--text-muted)">
            Profit calculated from products with buying price set.
          </p>
        </section>

        <section className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-violet-50 text-violet-700">
                <Package className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-(--text-primary)">
                  Product health
                </h3>
                <p className="text-xs text-(--text-muted)">
                  {productHealth.totalSkus.toLocaleString("en-BD")} catalog SKUs
                </p>
              </div>
            </div>
            <Link
              to="/admin/products"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Products <ArrowRight className="size-3.5" />
            </Link>
          </header>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-md bg-(--bg-app) p-3">
              <p className="text-xs text-(--text-muted)">Active and live</p>
              <p className="mt-1 text-xl font-bold text-emerald-700 tabular-nums">
                {productHealth.active}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-3">
              <p className="text-xs text-(--text-muted)">Blocked</p>
              <p className="mt-1 text-xl font-bold text-red-600 tabular-nums">
                {productHealth.blocked}
              </p>
            </div>
            <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3">
              <p className="flex items-center gap-1 text-xs text-amber-800">
                <TriangleAlert className="size-3.5" />
                Low stock (&lt; 5)
              </p>
              <p className="mt-1 text-lg font-bold text-amber-800 tabular-nums">
                {productHealth.lowStock}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-3">
              <p className="text-xs text-(--text-muted)">Out of stock</p>
              <p className="mt-1 text-lg font-bold text-(--text-primary) tabular-nums">
                {productHealth.outOfStock}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-(--text-muted)">
            Low-stock count excludes blocked products.
          </p>
        </section>

        <TopShopsCard shops={shopSummary.topShops} />
        <TopSellingItemsCard items={shopSummary.topItems} />
      </div>
    </section>
  )
}
