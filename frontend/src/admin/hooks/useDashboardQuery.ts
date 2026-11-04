import { useQuery } from "@tanstack/react-query"
import { dashboardApi } from "../api/dashboardApi"

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: ({ signal }) => dashboardApi.get(signal),
    staleTime: 30 * 1000, // ৩০ সেকেন্ডের জন্য ফ্রেশ
  })
}
