import { OrdersView } from "../components/orders/OrdersView"
import { orderQueryKeys, ordersApi } from "../api/ordersApi"

export default function OrdersPage() {
  return (
    <OrdersView
      api={ordersApi}
      queryKeys={orderQueryKeys}
      basePath="/shop/orders"
      courierDispatchEnabled
    />
  )
}
