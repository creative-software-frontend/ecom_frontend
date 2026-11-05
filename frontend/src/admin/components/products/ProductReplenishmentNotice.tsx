import { BellRing } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <aside className="flex flex-col gap-3 rounded-md border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-800">
          <BellRing className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">
            Replenishment Notice: {product.name} ({product.slug})
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
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
        <Button
          type="button"
          variant="secondary"
          onClick={onDismiss}
          className="h-auto rounded-md px-3 py-1.5 text-[10px]"
        >
          Dismiss
        </Button>
        <Button
          type="button"
          onClick={onViewLowStock}
          className="h-auto rounded-md px-3 py-1.5 text-[10px] hover:bg-(--primary-hover)"
        >
          View low stock
        </Button>
      </div>
    </aside>
  )
}
