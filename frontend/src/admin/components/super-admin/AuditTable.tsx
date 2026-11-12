import DataTable, { type TableColumn } from "react-data-table-component"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { AuditLogListItem } from "../../types/superAdmin"

// ১. অ্যাকশন অনুযায়ী চিপের কালার নির্ধারণ
function getActionStyle(action: string) {
  if (action.includes("create") || action.includes("dispatch"))
    return "bg-emerald-50 text-emerald-700"
  if (
    action.includes("deactivate") ||
    action.includes("fail") ||
    action.includes("reject")
  )
    return "bg-red-50 text-red-700"
  if (
    action.includes("rotate") ||
    action.includes("update") ||
    action.includes("fee")
  )
    return "bg-amber-50 text-amber-700"
  if (action.includes("renew")) return "bg-purple-50 text-purple-700"
  return "bg-blue-50 text-blue-700"
}

// ২. ইউজারের নামের প্রথম অক্ষর দিয়ে ডামি অ্যাভাটার
function getAvatar(name: string) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()
  const colors = [
    "bg-emerald-600",
    "bg-slate-600",
    "bg-blue-600",
    "bg-purple-600",
    "bg-amber-600",
  ]
  const color = colors[name.length % colors.length]
  return { initials, color }
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(",", ",")
}

function formatRelativeTime(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function AuditTable({
  items,
  isLoading,
  limit,
  total,
  paginationReset,
  onChangePage,
  onChangeRowsPerPage,
}: {
  items: AuditLogListItem[]
  isLoading: boolean
  limit: number
  total: number
  paginationReset: boolean
  onChangePage: (p: number) => void
  onChangeRowsPerPage: (l: number) => void
}) {
  const columns: TableColumn<AuditLogListItem>[] = [
    {
      name: "TIMESTAMP",
      minWidth: "150px",
      cell: (row) => (
        <div className="py-2">
          <p className="text-sm font-medium text-(--text-primary)">
            {formatTime(row.createdAt)}
          </p>
          <p className="text-xs text-(--text-muted)">
            {formatRelativeTime(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      name: "ACTOR / USER",
      minWidth: "220px",
      cell: (row) => {
        const avatar = getAvatar(row.user.name)
        return (
          <div className="flex items-center gap-2">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${avatar.color}`}
            >
              {avatar.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-(--text-primary)">
                {row.user.name}
              </p>
              <p className="truncate text-xs text-(--text-muted)">
                {row.user.email}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      name: "ACTION",
      minWidth: "180px",
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 font-mono text-xs font-medium ${getActionStyle(row.action)}`}
        >
          {row.action}
        </span>
      ),
    },
    {
      name: "TARGET ENTITY",
      minWidth: "240px",
      cell: (row) => (
        <div className="text-sm text-(--text-primary)">
          {row.entityType && (
            <span className="capitalize">{row.entityType} </span>
          )}
          {row.entityId && (
            <span className="font-mono text-xs text-(--text-muted)">
              #{row.entityId}
            </span>
          )}
          {!row.entityType && !row.entityId && (
            <span className="text-(--text-muted)">System</span>
          )}
          {/* ডামি ডেসক্রিপশন (কারণ ডাটাবেসে নেই) */}
          {row.entityType && (
            <span className="text-(--text-muted)"> (Target Data)</span>
          )}
        </div>
      ),
    },
    {
      name: "SCOPE / SHOP",
      minWidth: "150px",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 py-1 text-xs font-medium text-(--text-primary)`}
        >
          {row.shop ? (
            <>
              <span className="size-1.5 rounded-full bg-blue-500" />
              {row.shop.name}
            </>
          ) : (
            <>
              <span className="size-1.5 rounded-full bg-slate-400" />
              Platform Core
            </>
          )}
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      progressPending={isLoading}
      customStyles={adminDataTableStyles}
      pagination
      paginationServer
      paginationTotalRows={total}
      paginationDefaultPage={1}
      paginationResetDefaultPage={paginationReset}
      paginationPerPage={limit}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      paginationRowsPerPageOptions={[10, 20, 50, 100]}
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No audit logs found.
        </p>
      }
    />
  )
}
