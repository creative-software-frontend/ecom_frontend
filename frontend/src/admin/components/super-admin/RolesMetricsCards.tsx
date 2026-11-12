import { Shield, Users, Fingerprint, Check } from "lucide-react"
import { DashboardMetricCard } from "../dashboard/DashboardMetricCard"
import type { SuperAdminRole } from "../../types/superAdmin"

export function RolesMetricsCards({ roles }: { roles: SuperAdminRole[] }) {
  const totalRoles = roles.length
  const systemRoles = roles.filter((r) => r.isSystem).length
  const customRoles = totalRoles - systemRoles
  const activeAssignments = roles.reduce((sum, r) => sum + r.userCount, 0)
  const platformRoles = roles.filter((r) => r.scope === "platform").length

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <DashboardMetricCard
        label="Total Roles"
        value={totalRoles}
        subText={
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-600">
              <Check className="size-3" /> Active
            </span>
            <span className="text-(--text-muted)">
              {systemRoles} System default • {customRoles} Custom
            </span>
          </span>
        }
        icon={<Shield className="icon-size!" />}
      />

      <DashboardMetricCard
        label="Active Assignments"
        value={activeAssignments}
        subText="+14 this mo • Assigned across 42 shops & core"
        icon={<Users className="icon-size!" />}
      />

      <DashboardMetricCard
        label="Platform Scope"
        value={platformRoles}
        subText="Root & platform governance roles"
        icon={<Fingerprint className="icon-size! text-rose-500" />}
        badge={
          <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-bold tracking-wider text-rose-600 uppercase">
            High Security
          </span>
        }
      />
    </div>
  )
}
