import DataTable, { type TableColumn } from "react-data-table-component"
import { MoreVertical, Pencil, KeyRound, Power, PowerOff } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { SuperAdminUser } from "../../types/superAdmin"
import { relativeTime } from "@/admin/lib/formatTime"
import { getInitials } from "../../lib/initials"
import { PortalActionMenu } from "../common/PortalActionMenu"

const roleBadgeClass: Record<string, string> = {
  super_admin: "bg-(--primary-soft) text-(--primary)",
  platform_manager: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  shop_admin: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  salesman: "bg-(--bg-table-header) text-(--text-muted)",
  order_handler: "bg-(--status-shipped-bg) text-(--status-shipped-text)",
  product_uploader: "bg-(--status-pending-bg) text-(--status-pending-text)",
}

type UsersTableProps = {
  items: SuperAdminUser[]
  isLoading: boolean
  page: number
  limit: number
  total: number
  onChangePage: (next: number) => void
  onChangeRowsPerPage: (next: number) => void
  onEdit: (user: SuperAdminUser) => void
  onResetPassword: (user: SuperAdminUser) => void
  onToggleStatus: (user: SuperAdminUser) => void
}

export function UsersTable({
  items,
  isLoading,
  page,
  limit,
  total,
  onChangePage,
  onChangeRowsPerPage,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: UsersTableProps) {
  const columns: TableColumn<SuperAdminUser>[] = [
    {
      name: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--bg-table-header) text-xs font-semibold text-(--text-primary)">
            {getInitials(row.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-(--text-primary)">
              {row.name}
            </p>
            <p className="truncate text-xs text-(--text-muted)">
              {row.email}
            </p>
          </div>
        </div>
      ),
      minWidth: "220px",
      grow: 2,
    },
    {
      name: "Role",
      cell: (row) => {
        const cls =
          roleBadgeClass[row.role] ??
          "bg-(--bg-table-header) text-(--text-muted)"
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${cls}`}
          >
            {row.roleDisplayName}
          </span>
        )
      },
      width: "150px",
    },
    {
      name: "Shop",
      cell: (row) =>
        row.shop ? (
          <span className="text-xs text-(--text-primary)">
            {row.shop.name}
          </span>
        ) : (
          <span className="text-xs text-(--text-muted) italic">
            Platform
          </span>
        ),
      width: "160px",
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${
            row.status === "active"
              ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
              : "bg-(--bg-table-header) text-(--text-muted)"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              row.status === "active"
                ? "bg-(--status-delivered-text)"
                : "bg-(--text-muted)"
            }`}
          />
          {row.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
      width: "110px",
    },
    {
      name: "Last login",
      cell: (row) => (
        <span className="text-xs text-(--text-muted) tabular-nums">
          {relativeTime(row.lastLoginAt)}
        </span>
      ),
      width: "120px",
    },
    {
      name: "",
      cell: (row) => (
        <PortalActionMenu
          label={`Actions for ${row.name}`}
          trigger={<MoreVertical className="size-4" />}
          triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-table-header) hover:text-(--text-primary)"
          menuClassName="w-44"
        >
          {(closeMenu) => (
            <>
              {/* edit button */}
              {row.role !== "super_admin" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    onEdit(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <Pencil className="size-3.5" /> Edit
                </button>
              )}
              {/* reset password button */}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  closeMenu()
                  onResetPassword(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
              >
                <KeyRound className="size-3.5" /> Reset password
              </button>
              {/* toggle status button */}
              {row.role !== "super_admin" && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    onToggleStatus(row)
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover) ${
                    row.status === "active" ? "text-red-600" : "text-primary"
                  }`}
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
              )}
            </>
          )}
        </PortalActionMenu>
      ),
      width: "56px",
      right: true,
    },
  ]

  return (
    <DataTable
      className="admin-data-table"
      // key forces remount when page changes so internal pagination syncs
      // with server state — RDT doesn't fully support controlled page prop.
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
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No users found.
        </p>
      }
    />
  )
}
