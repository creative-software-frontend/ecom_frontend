import { useState } from "react"
import { ShopSelectorCard } from "../../components/super-admin/ShopSelectorCard"
import { CreateOrderForm } from "../../components/orders/CreateOrderForm"
import { MOCK_SHOPS } from "../../data/superAdminOrdersMock"

export default function SuperAdminOrderCreatePage() {
  const [shopId, setShopId] = useState<number | null>(null)
  const shopLocked = !shopId

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Shop selector — required before form is usable */}
      <ShopSelectorCard
        shops={MOCK_SHOPS}
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
