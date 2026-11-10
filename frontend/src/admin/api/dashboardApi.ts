import { apiRequest } from "./client"
import type { DashboardData } from "../types/dashboard"

export const dashboardApi = {
  get(signal?: AbortSignal): Promise<DashboardData> {
    return apiRequest<DashboardData>("/shop/dashboard", { signal })
  },
}
