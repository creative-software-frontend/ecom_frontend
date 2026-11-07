import { useQuery } from "@tanstack/react-query"
import { orderQueryKeys, ordersApi } from "../api/ordersApi"
import { productsApi } from "../api/productsApi"

export function useSidebarStats() {
  // ১. অর্ডারের কাউন্ট (limit: 1 দিলে ডেটা কম আসবে, কিন্তু counts অবজেক্ট পুরোটা পাবো)
  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: orderQueryKeys.stats(),
    queryFn: ({ signal }) => ordersApi.list({ limit: 1 }, signal),
  })

  // ২. প্রোডাক্টের কাউন্ট
  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin", "products", "stats"],
    queryFn: () => productsApi.list(),
  })

  return {
    pendingOrders: orderData?.counts?.pending ?? { count: 0, total: 0 },
    totalProducts: productData?.length ?? 0,
    isLoading: ordersLoading || productsLoading,
  }
}
