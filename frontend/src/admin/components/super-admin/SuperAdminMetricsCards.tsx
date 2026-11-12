import { Store, Users } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"
import type { SuperAdminDashboardData } from "../../types/superAdmin"

export function SuperAdminMetricsCards({
  metrics,
}: {
  metrics: SuperAdminDashboardData["metrics"]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="Total shops"
        value={metrics.totalShops}
        subText="All shops registered on the platform."
        icon={<Store className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Active shops"
        value={metrics.activeShops}
        subText="Shops currently enabled and operating."
        variant="success"
        icon={<Store className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Total users"
        value={metrics.totalUsers}
        subText="All user accounts across the platform."
        icon={<Users className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Active users"
        value={metrics.activeUsers}
        subText="Accounts currently active and able to sign in."
        variant="success"
        icon={<Users className="icon-size!" />}
      />
    </div>
  )
}
