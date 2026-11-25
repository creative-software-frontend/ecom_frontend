import { OrderDetailView } from "@/admin/components/orders/OrderDetailView"
import {
  superAdminOrderQueryKeys,
  superAdminOrdersApi,
} from "@/admin/api/superAdminOrdersApi"

const api = {
  get: (id: string, signal: AbortSignal) => superAdminOrdersApi.get(id, signal),
  updateStatus: superAdminOrdersApi.updateStatus,
}

export default function SuperAdminOrderDetailPage() {
  return (
    <OrderDetailView
      api={api}
      queryKeys={superAdminOrderQueryKeys}
      basePath="/admin/orders"
      showShopName
    />
  )
}
