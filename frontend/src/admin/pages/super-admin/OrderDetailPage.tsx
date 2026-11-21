import { OrderDetailView } from "@/admin/components/orders/OrderDetailView"
import {
  superAdminOrderQueryKeys,
  superAdminOrdersApi,
} from "@/admin/api/superAdminOrdersApi"

// The super-admin list is still mock-backed and ignores abort signals.
const api = {
  get: (id: string, _signal: AbortSignal) => superAdminOrdersApi.get(id),
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
