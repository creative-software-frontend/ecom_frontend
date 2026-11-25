import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { OrdersView } from "@/admin/components/orders/OrdersView"
import {
  superAdminOrderQueryKeys,
  superAdminOrdersApi,
} from "@/admin/api/superAdminOrdersApi"
import { superAdminApi } from "@/admin/api/superAdminApi"

export default function OrdersPage() {
  const shopsQuery = useQuery({
    queryKey: ["admin", "super", "shops", "filter-options"],
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
    staleTime: 60 * 1000,
  })

  const shopFilterOptions = useMemo(
    () =>
      (shopsQuery.data ?? []).map((shop) => ({
        id: shop.id,
        name: shop.name,
      })),
    [shopsQuery.data]
  )

  return (
    <OrdersView
      api={superAdminOrdersApi}
      queryKeys={superAdminOrderQueryKeys}
      basePath="/admin/orders"
      showShopColumn
      shopFilterOptions={shopFilterOptions}
    />
  )
}
