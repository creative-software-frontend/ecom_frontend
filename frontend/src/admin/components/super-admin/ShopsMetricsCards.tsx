import { Store, Activity, AlertCircle } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"
import type { ShopsListResponse } from "../../types/superAdmin"

export function ShopsMetricsCards({
  counts,
}: {
  counts: ShopsListResponse["counts"]
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardMetricCard
        label="Total Shops"
        value={
          <>
            {counts.total}{" "}
            <span className="text-sm text-(--text-muted)">
              across Bangladesh
            </span>
          </>
        }

        subText={
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500"></span>{" "}
              {counts.active} Active
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500"></span>{" "}
              {counts.trial} Trial
            </span>
          </span>
        }
        icon={<Store className="icon-size!" />}
      />
      <DashboardMetricCard
        label="Active Subscriptions"
        value={counts.active}
        subText="৳ 1,250,000 monthly ARR" // ডামি ডেটা
        icon={<Activity className="icon-size! text-emerald-500" />}
      />
      <DashboardMetricCard
        label="Needs Attention"
        value={
          <>
            {counts.trial + counts.inactive}{" "}
            <span className="text-sm text-(--text-muted)">
              requires admin review
            </span>
          </>
        }
        subText="3 trials expiring within 48h, 1 suspended" // ডামি ডেটা
        icon={<AlertCircle className="icon-size! text-red-500" />}
        variant="warning"
      />
    </div>
  )
}
