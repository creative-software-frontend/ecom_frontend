import { OrderDetailView } from "../components/orders/OrderDetailView"
import { orderQueryKeys, ordersApi } from "../api/ordersApi"

export default function OrderDetailPage() {
  return (
    <OrderDetailView
      api={ordersApi}
      queryKeys={orderQueryKeys}
      basePath="/shop/orders"
      invalidateStats
      courierDispatchEnabled
    />
  )
}
