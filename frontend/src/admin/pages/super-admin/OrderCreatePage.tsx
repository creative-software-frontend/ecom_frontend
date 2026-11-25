import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ShopSelectorCard } from "../../components/super-admin/ShopSelectorCard"
import { CreateOrderForm } from "../../components/orders/CreateOrderForm"
import { ErrorState } from "../../components/common/ErrorState"
import { LoadingState } from "../../components/common/LoadingState"
import { superAdminApi } from "../../api/superAdminApi"

export default function SuperAdminOrderCreatePage() {
  const [shopId, setShopId] = useState<number | null>(null)
  const shopLocked = !shopId

  const shopsQuery = useQuery({
    queryKey: ["admin", "super", "shops", "order-form-options"],
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
    staleTime: 60 * 1000,
  })

  const shops = useMemo(
    () =>
      (shopsQuery.data ?? []).map((shop) => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
      })),
    [shopsQuery.data]
  )

  if (shopsQuery.isPending) {
    return (
      <LoadingState className="p-8 text-center text-sm text-(--text-muted)">
        Loading shops...
      </LoadingState>
    )
  }

  if (shopsQuery.isError) {
    return (
      <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
        <ErrorState
          message="Failed to load shops. Please try again."
          onRetry={() => void shopsQuery.refetch()}
          className="flex flex-col items-center gap-3 rounded-md border border-(--border-light) bg-(--bg-surface) py-16 text-center"
          messageClassName="text-sm font-medium text-(--text-muted)"
          buttonClassName="inline-flex h-9 items-center rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Shop selector — required before form is usable */}
      <ShopSelectorCard
        shops={shops}
        value={shopId}
        onChange={setShopId}
      />

      {/* Form — locked until shop selected */}
      <div
        className={
          shopLocked ? "pointer-events-none opacity-40 select-none" : ""
        }
      >
        <CreateOrderForm
          cancelHref="/admin/orders"
          shopId={shopId}
          variant="embedded"
        />
      </div>
    </div>
  )
}
