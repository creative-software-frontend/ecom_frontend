import { Link } from "react-router"
import { ArrowRight, Shield, Store } from "lucide-react"
import { useAdminRolesList } from "../../hooks/useAdminUsers"
import type { SuperAdminDashboardData } from "../../types/superAdmin"
import { formatDate } from "../../lib/formatTime"

export function RoleAccessOverviewCard() {
  const { data: roles, isLoading, isError } = useAdminRolesList()

  const totalAssignments =
    roles?.reduce((sum, role) => sum + role.userCount, 0) ?? 0
  const systemRoles = roles?.filter((role) => role.isSystem).length ?? 0
  const platformRoles =
    roles?.filter((role) => role.scope === "platform").length ?? 0

  return (
    <section className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
      <header className="flex items-center justify-between gap-2 border-b border-(--border-light) pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
            <Shield className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              Roles & access
            </h2>
            <p className="text-xs text-(--text-muted)">
              Platform governance snapshot
            </p>
          </div>
        </div>
        <Link
          to="/admin/roles"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Manage <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {isLoading ? (
        <p className="py-5 text-center text-xs text-(--text-muted)">
          Loading roles…
        </p>
      ) : isError ? (
        <p className="py-5 text-center text-xs text-red-600">
          Role data could not be loaded.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div className="rounded-md bg-(--bg-app) p-3">
            <p className="text-xs text-(--text-muted)">Configured roles</p>
            <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
              {roles?.length ?? 0}
            </p>
          </div>
          <div className="rounded-md bg-(--bg-app) p-3">
            <p className="text-xs text-(--text-muted)">User assignments</p>
            <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
              {totalAssignments}
            </p>
          </div>
          <div className="col-span-2 flex items-center justify-between text-xs text-(--text-muted)">
            <span>{systemRoles} system roles</span>
            <span>{platformRoles} platform-scoped</span>
          </div>
        </div>
      )}
    </section>
  )
}

export function TrialShopsAttentionCard({
  shops,
}: {
  shops: SuperAdminDashboardData["trialExpiringSoon"]
}) {
  return (
    <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
      <header className="flex items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-amber-50 text-amber-700">
            <Store className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              Trial shops to review
            </h2>
            <p className="text-xs text-(--text-muted)">
              Trials ending soon or already due
            </p>
          </div>
        </div>
        <Link
          to="/admin/shops"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View shops <ArrowRight className="size-3.5" />
        </Link>
      </header>
      {shops.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-(--text-muted)">
          No trial shops need attention right now.
        </p>
      ) : (
        <ul className="divide-y divide-(--border-light)">
          {shops.slice(0, 5).map((shop) => (
            <li
              key={shop.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-(--text-primary)">
                  {shop.name}
                </p>
                <p className="truncate text-[11px] text-(--text-muted)">
                  {shop.slug}
                </p>
              </div>
              <time className="shrink-0 rounded bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800">
                {formatDate(shop.trialEndsAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
