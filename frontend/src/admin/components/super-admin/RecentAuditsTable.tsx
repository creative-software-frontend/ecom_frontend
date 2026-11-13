import { Link } from "react-router"
import DataTable, { type TableColumn } from "react-data-table-component"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { relativeTime } from "../../lib/formatTime"
import type { SuperAdminDashboardData } from "../../types/superAdmin"

type AuditRow = SuperAdminDashboardData["recentAudits"][number]

function humanizeAction(action: string): string {
  return action
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" · ")
}

const columns: TableColumn<AuditRow>[] = [
  {
    name: "Action",
    cell: (row) => (
      <span className="text-xs font-medium text-(--text-primary)">
        {humanizeAction(row.action)}
      </span>
    ),
    minWidth: "160px",
  },
  {
    name: "User",
    cell: (row) => (
      <div className="min-w-0">
        <p className="truncate text-xs text-(--text-primary)">
          {row.user.name}
        </p>
        <p className="truncate text-xs text-(--text-muted)">
          {row.user.email}
        </p>
      </div>
    ),
    minWidth: "180px",
    grow: 1,
  },
  {
    name: "Shop",
    cell: (row) =>
      row.shop ? (
        <span className="text-xs text-(--text-primary)">
          {row.shop.name}
        </span>
      ) : (
        <span className="text-xs text-(--text-muted) italic">Platform</span>
      ),
    width: "150px",
  },
  {
    name: "When",
    cell: (row) => (
      <span className="text-xs text-(--text-muted) tabular-nums">
        {relativeTime(row.createdAt)}
      </span>
    ),
    width: "100px",
    right: true,
  },
]

export function RecentAuditsTable({ audits }: { audits: AuditRow[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <header className="flex items-center justify-between border-b border-(--border-light) bg-(--bg-table-header) px-4 py-3">
        <h2 className="text-sm font-semibold text-(--text-primary)">
          Recent activity
        </h2>
        <Link
          to="/admin/audit"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </header>
      <DataTable
        className="admin-data-table"
        columns={columns}
        data={audits}
        customStyles={adminDataTableStyles}
        pagination={false}
        noDataComponent={
          <p className="py-10 text-center text-sm text-(--text-muted)">
            No recent activity.
          </p>
        }
      />
    </section>
  )
}
