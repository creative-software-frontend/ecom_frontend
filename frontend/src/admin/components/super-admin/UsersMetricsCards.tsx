import { Users, UserCheck, UserX } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"

export function UsersMetricsCards({ totalUsers }: { totalUsers: number }) {
  // Note: Backend থেকে আপাতত শুধু totalUsers আসছে, তাই Active/Inactive ডামি ডেটা দিয়ে দেখানো হচ্ছে।
  const activeUsers = Math.floor(totalUsers * 0.96)
  const inactiveUsers = totalUsers - activeUsers
  const activePercent =
    totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : "0"

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardMetricCard
        label="TOTAL USERS"
        value={totalUsers}
        subText={
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Across 28 shops & platform core
          </span>
        }
        icon={<Users className="icon-size!" />}
      />
      <DashboardMetricCard
        label="ACTIVE USERS"
        value={activeUsers}
        subText={
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Logged in last 30 days
          </span>
        }
        badge={
          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700">
            ↑ {activePercent}%
          </span>
        }
        icon={<UserCheck className="icon-size! text-emerald-600" />}
      />
      <DashboardMetricCard
        label="INACTIVE / SUSPENDED"
        value={inactiveUsers}
        subText="2 invitations pending • 4 deactivated"
        badge={
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-bold text-rose-600">
            Action Needed
          </span>
        }
        icon={<UserX className="icon-size! text-rose-500" />}
      />
    </div>
  )
}
