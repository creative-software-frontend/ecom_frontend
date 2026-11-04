import { Link } from "react-router"
import { Calendar, Plus, RefreshCw } from "lucide-react"
import { useDashboardQuery } from "../hooks/useDashboardQuery"
import { MetricsCards } from "../components/dashboard/MetricsCards"
import { PendingVerificationCard } from "../components/dashboard/PendingVerificationCard"
import { WeeklyChartCard } from "../components/dashboard/WeeklyChartCard"
import { CourierCard } from "../components/dashboard/CourierCard"
import { ErrorState } from "../components/common/ErrorState"

export default function DashboardPage() {
  const { data, isLoading, isFetching, error, refetch } = useDashboardQuery()

  const today = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date())

  return (
    <div className="min-w-0 space-y-6 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-(--text-primary)">
              Dashboard
            </h1>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live operations
            </span>
          </div>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Real-time orders, verification queue, and fulfillment overview
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium text-(--text-muted)">
            <Calendar className="size-3.5" />
            {today}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            <RefreshCw
              className={`size-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
          >
            <Plus className="size-3.5" />
            View Orders
          </Link>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex min-h-100 items-center justify-center text-sm text-(--text-muted)">
          Loading dashboard…
        </div>
      )}

      {/* Error */}
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

      {/* Content */}
      {!isLoading && !error && data && (
        <>
          <MetricsCards metrics={data.metrics} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <PendingVerificationCard
                orders={data.pendingVerificationOrders}
                totalPending={data.metrics.waitingConfirmation.count}
              />
            </div>
            <div className="space-y-6 lg:col-span-4">
              <WeeklyChartCard chart={data.weeklyChart} />
              <CourierCard courier={data.courierSummary} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
