import { OrdersView } from "@/admin/components/orders/OrdersView"
import {
  superAdminOrderQueryKeys,
  superAdminOrdersApi,
} from "@/admin/api/superAdminOrdersApi"
import { MOCK_SHOPS } from "@/admin/data/superAdminOrdersMock"

const SHOP_FILTER_OPTIONS = MOCK_SHOPS.map((shop) => ({
  id: shop.id,
  name: shop.name,
}))

export default function OrdersPage() {
  return (
    <OrdersView
      api={superAdminOrdersApi}
      queryKeys={superAdminOrderQueryKeys}
      basePath="/admin/orders"
      showShopColumn
      shopFilterOptions={SHOP_FILTER_OPTIONS}
    />
  )
}
