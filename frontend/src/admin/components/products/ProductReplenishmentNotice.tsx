import { BellRing } from "lucide-react"
import { StatusBadge } from "../common/StatusBadge"
import type { Product } from "../../types/product"

type ProductReplenishmentNoticeProps = {
  product: Product
  onDismiss: () => void
  onViewLowStock: () => void
}

export function ProductReplenishmentNotice({
  product,
  onDismiss,
  onViewLowStock,
}: ProductReplenishmentNoticeProps) {
  return (
    <aside className="admin-dashboard-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#ffe0d6] text-[#9a3412]">
          <BellRing className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-(--text-primary)">
            Replenishment Notice: {product.name} ({product.slug})
          </p>
          <p className="mt-0.5 text-[10px] text-(--text-muted)">
            Only {product.stockQuantity} units remain in stock. Review this
            product before it sells out.
          </p>
        </div>
        <StatusBadge
          variant="low-stock"
          label="Low stock"
          className="hidden shrink-0 sm:inline-flex"
        />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md bg-[#eef0ff] px-3 py-1.5 text-[10px] font-medium text-(--text-primary) hover:bg-[#e2e7ff]"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={onViewLowStock}
          className="rounded-md bg-(--primary) px-3 py-1.5 text-[10px] font-medium text-white hover:bg-(--primary-hover)"
        >
          View low stock
        </button>
      </div>
    </aside>
  )
}
