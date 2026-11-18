import { ArrowRight, Package, ShoppingCart, TriangleAlert } from "lucide-react"
import { Link } from "react-router"
import { MOCK_ORDERS } from "../../data/superAdminOrdersMock"
import { MOCK_SUPER_ADMIN_PRODUCTS } from "../../data/superAdminProductsMock"
import { MOCK_SHOP_SUMMARY } from "../../data/shopSummaryMock"
import { formatTaka } from "../../lib/orderStatus"
import { TopSellingItemsCard } from "./TopSellingItemsCard"
import { TopShopsCard } from "./TopShopsCard"

const ORDER_STAGES = [
  { status: "pending", label: "Pending", color: "bg-amber-500" },
  { status: "confirmed", label: "Confirmed", color: "bg-blue-500" },
  { status: "shipped", label: "Shipped", color: "bg-indigo-500" },
  { status: "delivered", label: "Delivered", color: "bg-emerald-500" },
  { status: "cancelled", label: "Cancelled", color: "bg-red-500" },
] as const

const orderCountByStatus = (status: string) =>
  MOCK_ORDERS.filter((order) => order.orderStatus === status).length

const orderSales = MOCK_ORDERS.reduce(
  (sum, order) => sum + (order.currentPrice ?? order.total),
  0
)
const unpaidAmount = MOCK_ORDERS.filter(
  (order) => order.paymentStatus === "unpaid"
).reduce((sum, order) => sum + order.total, 0)
const estimatedProfit = MOCK_ORDERS.reduce(
  (sum, order) =>
    sum + (order.currentPrice ?? order.total) - (order.buyingPrice ?? 0),
  0
)

const activeProducts = MOCK_SUPER_ADMIN_PRODUCTS.filter(
  (product) => product.isActive && !product.isBlocked
).length
const blockedProducts = MOCK_SUPER_ADMIN_PRODUCTS.filter(
  (product) => product.isBlocked
).length
const lowStockProducts = MOCK_SUPER_ADMIN_PRODUCTS.filter(
  (product) =>
    !product.isBlocked && product.stockQuantity > 0 && product.stockQuantity < 5
).length
const outOfStockProducts = MOCK_SUPER_ADMIN_PRODUCTS.filter(
  (product) => !product.isBlocked && product.stockQuantity === 0
).length

function MockDataBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 uppercase">
      Demo data
    </span>
  )
}

export function SuperAdminDemoAnalytics() {
  return (
    <section aria-labelledby="demo-analytics-heading" className="space-y-3">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="demo-analytics-heading"
            className="text-base font-semibold text-(--text-primary)"
          >
            Commerce analytics
          </h2>
          <p className="text-xs text-(--text-muted)">
            Orders, products and sales performance across shops
          </p>
        </div>
        <MockDataBadge />
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
                  {MOCK_ORDERS.length} sample orders
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
                {formatTaka(orderSales)}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-2.5">
              <p className="text-[11px] text-(--text-muted)">Unpaid amount</p>
              <p className="mt-1 text-sm font-bold text-amber-700 tabular-nums">
                {formatTaka(unpaidAmount)}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-2.5">
              <p className="text-[11px] text-(--text-muted)">
                Est. gross profit
              </p>
              <p className="mt-1 text-sm font-bold text-emerald-700 tabular-nums">
                {formatTaka(estimatedProfit)}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {ORDER_STAGES.map((stage) => {
              const count = orderCountByStatus(stage.status)
              const percent =
                MOCK_ORDERS.length > 0 ? (count / MOCK_ORDERS.length) * 100 : 0

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
            Profit uses estimated buying prices from sample order data.
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
                  {MOCK_SUPER_ADMIN_PRODUCTS.length} sample catalog products
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
                {activeProducts}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-3">
              <p className="text-xs text-(--text-muted)">Blocked</p>
              <p className="mt-1 text-xl font-bold text-red-600 tabular-nums">
                {blockedProducts}
              </p>
            </div>
            <div className="rounded-md border border-amber-100 bg-amber-50/60 p-3">
              <p className="flex items-center gap-1 text-xs text-amber-800">
                <TriangleAlert className="size-3.5" />
                Low stock (&lt; 5)
              </p>
              <p className="mt-1 text-lg font-bold text-amber-800 tabular-nums">
                {lowStockProducts}
              </p>
            </div>
            <div className="rounded-md bg-(--bg-app) p-3">
              <p className="text-xs text-(--text-muted)">Out of stock</p>
              <p className="mt-1 text-lg font-bold text-(--text-primary) tabular-nums">
                {outOfStockProducts}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-(--text-muted)">
            Low-stock count excludes blocked products.
          </p>
        </section>

        <TopShopsCard shops={MOCK_SHOP_SUMMARY.topShops} />
        <TopSellingItemsCard items={MOCK_SHOP_SUMMARY.topItems} />
      </div>
    </section>
  )
}
