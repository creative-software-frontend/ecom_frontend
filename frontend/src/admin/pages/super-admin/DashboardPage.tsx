import { Link } from "react-router"
import { Calendar, RefreshCw, Store } from "lucide-react"
import { SuperAdminMetricsCards } from "../../components/super-admin/SuperAdminMetricsCards"
import { RecentAuditsTable } from "../../components/super-admin/RecentAuditsTable"
import { UsersByRoleCard } from "../../components/super-admin/UsersByRoleCard"
import { ShopsByStatusCard } from "../../components/super-admin/ShopsByStatusCard"
import { useSuperAdminDashboardQuery } from "../../hooks/useAdminUsers"
import { ErrorState } from "../../components/common/ErrorState"

export default function SuperAdminDashboardPage() {
  const { data, isLoading, isFetching, error, refetch } =
    useSuperAdminDashboardQuery()

  const today = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="min-w-0 space-y-6 bg-(--bg-app) p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-(--text-primary)">
              Platform Dashboard
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs text-emerald-800">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live
            </span>
          </div>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Platform-wide overview of shops, users, and recent activity
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium text-(--text-muted)">
            <Calendar className="icon-size" />
            {today}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-xs"
          >
            <RefreshCw
              className={`icon-size ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            to="/admin/shops"
            className="admin-template-button admin-template-button--primary h-8 px-3 text-xs"
          >
            <Store className="icon-size" />
            Manage Shops
          </Link>
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-100 items-center justify-center text-sm text-(--text-muted)">
          Loading dashboard…
        </div>
      )}

      {!isLoading && error && (
        <ErrorState
          message={
            error instanceof Error ? error.message : "Failed to load dashboard"
          }
          onRetry={() => refetch()}
          className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 py-16 text-center"
          messageClassName="text-sm font-medium text-red-600"
          buttonClassName="rounded-md bg-(--primary) px-4 py-2 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      )}

      {!isLoading && !error && data && (
        <>
          <SuperAdminMetricsCards metrics={data.metrics} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <RecentAuditsTable audits={data.recentAudits} />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <UsersByRoleCard usersByRole={data.usersByRole} />
              <ShopsByStatusCard
                shopsByStatus={data.shopsByStatus}
                trialExpiringSoon={data.trialExpiringSoon}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
