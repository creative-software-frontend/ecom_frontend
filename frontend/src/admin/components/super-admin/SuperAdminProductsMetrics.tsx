import { Package, PackageCheck, Ban, TriangleAlert } from "lucide-react"
import { MetricCard } from "../products/MetricCard"
import type { SuperAdminProduct } from "../../types/superAdminProduct"

const LOW_STOCK_THRESHOLD = 5

export function SuperAdminProductsMetrics({
  products,
}: {
  products: SuperAdminProduct[]
}) {
  const total = products.length
  const active = products.filter((p) => !p.isBlocked && p.isActive).length
  const blocked = products.filter((p) => p.isBlocked).length
  const lowStock = products.filter(
    (p) => !p.isBlocked && p.stockQuantity < LOW_STOCK_THRESHOLD
  ).length

  return (
    <section
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Products summary"
    >
      <MetricCard
        label="Total Products"
        value={String(total)}
        detail={`Across ${new Set(products.map((p) => p.shopId)).size} shops`}
        icon={Package}
        tone="teal"
      />
      <MetricCard
        label="Active Products"
        value={String(active)}
        detail="Live on storefronts"
        icon={PackageCheck}
        tone="teal"
      />
      <MetricCard
        label="Blocked Products"
        value={String(blocked)}
        detail="Frozen — needs review"
        icon={Ban}
        tone="coral"
      />
      <MetricCard
        label="Low Stock Alert"
        value={`${lowStock} SKU${lowStock === 1 ? "" : "s"}`}
        detail="Below 5 units"
        icon={TriangleAlert}
        tone="indigo"
      />
    </section>
  )
}
