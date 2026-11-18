import { Store, Users, UserCheck, Clock3, CircleOff } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"
import type { SuperAdminDashboardData } from "../../types/superAdmin"

export function SuperAdminMetricsCards({
  dashboard,
}: {
  dashboard: SuperAdminDashboardData
}) {
  const { metrics, shopsByStatus, trialExpiringSoon } = dashboard
  const trialShops =
    shopsByStatus.find(({ status }) => status === "trial")?.count ?? 0
  const inactiveShops =
    shopsByStatus.find(({ status }) => status === "inactive")?.count ?? 0

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <DashboardMetricCard
        label="Total shops"
        value={metrics.totalShops}
        subText="All registered platform stores"
        icon={<Store className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Active shops"
        value={metrics.activeShops}
        subText="Currently enabled and operating"
        variant="success"
        icon={<Store className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Trial shops"
        value={trialShops}
        subText={`${trialExpiringSoon.length} in the review queue`}
        variant={trialExpiringSoon.length > 0 ? "warning" : "default"}
        icon={<Clock3 className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Inactive shops"
        value={inactiveShops}
        subText="Suspended or disabled stores"
        variant={inactiveShops > 0 ? "warning" : "default"}
        icon={<CircleOff className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Total users"
        value={metrics.totalUsers}
        subText="Accounts across shops and platform"
        icon={<Users className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Active users"
        value={metrics.activeUsers}
        subText="Currently enabled accounts"
        variant="success"
        icon={<UserCheck className="icon-size!" />}
      />
    </div>
  )
}
