import { Users, UserCheck, UserX } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"

export function ShopUsersMetricsCards({
  total,
  active,
  inactive,
}: {
  total: number
  active: number
  inactive: number
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardMetricCard
        label="TOTAL USERS"
        value={total}
        subText="Across all roles"
        icon={<Users className="icon-size!" />}
      />
      <DashboardMetricCard
        label="ACTIVE USERS"
        value={active}
        subText="Logged in last 30 days"
        icon={<UserCheck className="icon-size! text-emerald-600" />}
      />
      <DashboardMetricCard
        label="INACTIVE"
        value={inactive}
        subText={`${inactive} pending invitation`}
        icon={<UserX className="icon-size! text-amber-600" />}
        variant="warning"
      />
    </div>
  )
}
