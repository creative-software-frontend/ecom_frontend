import { FileText, Edit3, ShieldCheck, AlertTriangle } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"

export function AuditMetricsCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardMetricCard
        label="TOTAL EVENTS (24H)"
        value="14,892"
        subText={
          <span className="font-medium text-emerald-600">↗ +12% vs yday</span>
        }
        icon={<FileText className="icon-size!" />}
      />
      <DashboardMetricCard
        label="MUTATIONS / WRITES"
        value="3,420"
        subText="POST/PUT/DELETE"
        icon={<Edit3 className="icon-size!" />}
      />
      <DashboardMetricCard
        label="SECURITY & AUTH"
        value="142"
        subText="Logins • 2FA • Key Rotations"
        icon={<ShieldCheck className="icon-size!" />}
      />
      <DashboardMetricCard
        label="FAILED / REJECTED"
        value="18"
        subText={
          <span className="font-medium text-red-600">
            2 high-severity alerts
          </span>
        }
        variant="danger"
        icon={<AlertTriangle className="icon-size!" />}
      />
    </div>
  )
}
