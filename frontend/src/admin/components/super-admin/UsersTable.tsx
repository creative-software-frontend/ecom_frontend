import DataTable, { type TableColumn } from "react-data-table-component"
import {
  MoreVertical,
  Pencil,
  KeyRound,
  Power,
  PowerOff,
  Globe,
  Store,
} from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { SuperAdminUser } from "../../types/superAdmin"
import { relativeTime } from "@/admin/lib/formatTime"
import { getInitials } from "../../lib/initials"
import { PortalActionMenu } from "../common/PortalActionMenu"

type UsersTableProps = {
  items: SuperAdminUser[]
  isLoading: boolean
  page: number
  limit: number
  total: number
  currentUserId: number
  onChangePage: (next: number) => void
  onChangeRowsPerPage: (next: number) => void
  onEdit: (user: SuperAdminUser) => void
  onResetPassword: (user: SuperAdminUser) => void
  onToggleStatus: (user: SuperAdminUser) => void
}

const roleBadgeMap: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700",
  shop_admin: "bg-emerald-100 text-emerald-700",
  order_handler: "bg-purple-100 text-purple-700",
  platform_manager: "bg-blue-100 text-blue-700",
}

export function UsersTable({
  items,
  isLoading,
  page,
  limit,
  total,
  currentUserId,
  onChangePage,
  onChangeRowsPerPage,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: UsersTableProps) {
  const columns: TableColumn<SuperAdminUser>[] = [
    {
      name: "SL",
      cell: (_row, index) => index + 1,
      grow: 0,
    },
    {
      name: "USER DETAILS",
      minWidth: "280px",
      grow: 2,
      cell: (row) => {
        const isMe = row.id === currentUserId
        return (
          <div className="flex items-center gap-3 py-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--bg-surface-hover) text-xs font-bold text-(--text-primary)">
              {getInitials(row.name)}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-(--text-primary)">
                  {row.name}
                </p>
                {isMe && (
                  <span className="rounded bg-(--bg-surface-hover) px-1.5 py-0.5 text-xs font-medium text-(--text-muted)">
                    You
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-(--text-muted)">
                {row.email}
              </p>
              <p className="truncate text-xs text-(--text-muted) tabular-nums">
                {row.mobile || "+880 1700-000000"}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      name: "ROLE",
      minWidth: "140px",
      cell: (row) => {
        const badgeClass =
          roleBadgeMap[row.role] || "bg-(--bg-table-header) text-(--text-muted)"
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium tracking-wider uppercase ${badgeClass}`}
          >
            {row.roleDisplayName}
          </span>
        )
      },
    },
    {
      name: "ASSIGNED SHOP",
      minWidth: "160px",
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-sm text-(--text-primary)">
          {row.shop ? (
            <>
              <Store className="size-3.5 text-(--text-muted)" /> {row.shop.name}
            </>
          ) : (
            <>
              <Globe className="size-3.5 text-(--text-muted)" /> Platform Core
            </>
          )}
        </span>
      ),
    },
    {
      name: "STATUS",
      width: "110px",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
            row.status === "active"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-(--bg-surface-hover) text-(--text-muted)"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${row.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`}
          />
          {row.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      name: "LAST ACTIVE",
      minWidth: "140px",
      cell: (row) => (
        <span className="text-xs text-(--text-muted) tabular-nums">
          {relativeTime(row.lastLoginAt)}
        </span>
      ),
    },
    {
      name: "ACTIONS",
      width: "90px",
      right: true,
      cell: (row) => (
        <PortalActionMenu
          label={`Actions for ${row.name}`}
          trigger={<MoreVertical className="size-4" />}
          triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
          menuClassName="w-44"
        >
          {(closeMenu) => (
            <>
              {row.role !== "super_admin" && (
                <>
                  <button
                    onClick={() => {
                      closeMenu()
                      onEdit(row)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
                  >
                    <Pencil className="size-3.5" /> Edit User
                  </button>
                  <button
                    onClick={() => {
                      closeMenu()
                      onToggleStatus(row)
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover) ${row.status === "active" ? "text-red-600" : "text-primary"}`}
                  >
                    {row.status === "active" ? (
                      <>
                        <PowerOff className="size-3.5" /> Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="size-3.5" /> Activate
                      </>
                    )}
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  closeMenu()
                  onResetPassword(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
              >
                <KeyRound className="size-3.5" /> Reset Password
              </button>
            </>
          )}
        </PortalActionMenu>
      ),
    },
  ]

  return (
    <DataTable
      key={`users-page-${page}`}
      columns={columns}
      data={items}
      progressPending={isLoading}
      customStyles={adminDataTableStyles}
      pagination
      paginationServer
      paginationTotalRows={total}
      paginationDefaultPage={page}
      paginationPerPage={limit}
      paginationRowsPerPageOptions={[10, 20, 50, 100]}
      onChangePage={onChangePage}
      onChangeRowsPerPage={onChangeRowsPerPage}
      // selectableRows
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No users found.
        </p>
      }
    />
  )
}
