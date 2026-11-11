import DataTable, { type TableColumn } from "react-data-table-component"
import { MoreVertical, Pencil, Trash2, Shield, Store } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { SuperAdminRole } from "../../types/superAdmin"
import { PortalActionMenu } from "../common/PortalActionMenu"

type RolesTableProps = {
  items: SuperAdminRole[]
  isLoading: boolean
  onEdit: (role: SuperAdminRole) => void
  onDelete: (role: SuperAdminRole) => void
}

export function RolesTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const columns: TableColumn<SuperAdminRole>[] = [
    {
      name: "Role",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-(--text-primary)">
            {row.displayName}
          </p>
          <p className="truncate font-mono text-[11px] text-(--text-muted)">
            {row.name}
          </p>
        </div>
      ),
      minWidth: "180px",
      grow: 2,
    },
    {
      name: "Scope",
      cell: (row) => {
        const Icon = row.scope === "platform" ? Shield : Store
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium ${
              row.scope === "platform"
                ? "bg-(--primary-soft) text-primary"
                : "bg-(--bg-table-header) text-(--text-muted)"
            }`}
          >
            <Icon className="size-3" />
            {row.scope === "platform" ? "Platform" : "Shop"}
          </span>
        )
      },
      width: "130px",
    },
    {
      name: "Users",
      cell: (row) => (
        <span className="text-[12px] text-(--text-primary) tabular-nums">
          {row.userCount}
        </span>
      ),
      width: "80px",
      right: true,
    },
    {
      name: "System",
      cell: (row) =>
        row.isSystem ? (
          <span className="inline-flex items-center rounded-md bg-(--bg-table-header) px-2 py-0.5 text-[10px] font-medium text-(--text-muted)">
            System
          </span>
        ) : (
          <span className="text-[11px] text-(--text-muted) italic">Custom</span>
        ),
      width: "100px",
    },
    {
      name: "",
      cell: (row) => {
        const isSuperAdmin = row.name === "super_admin"
        const canDelete = !row.isSystem && row.userCount === 0

        return (
          <PortalActionMenu
            label={`Actions for ${row.displayName}`}
            trigger={<MoreVertical className="size-4" />}
            triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-table-header) hover:text-(--text-primary)"
            menuClassName="w-44"
          >
            {(closeMenu) => (
              <>
                <button
                  type="button"
                  role="menuitem"
                  disabled={isSuperAdmin}
                  onClick={() => {
                    closeMenu()
                    onEdit(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Pencil className="size-3.5" />
                  {isSuperAdmin ? "View (locked)" : "Edit"}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canDelete}
                  onClick={() => {
                    closeMenu()
                    onDelete(row)
                  }}
                  title={
                    row.isSystem
                      ? "System roles cannot be deleted"
                      : row.userCount > 0
                        ? `${row.userCount} user(s) have this role`
                        : undefined
                  }
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:text-(--text-muted) disabled:hover:bg-transparent"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </>
            )}
          </PortalActionMenu>
        )
      },
      width: "56px",
      right: true,
    },
  ]

  return (
    <DataTable
      className="admin-data-table"
      columns={columns}
      data={items}
      progressPending={isLoading}
      customStyles={adminDataTableStyles}
      pagination
      paginationRowsPerPageOptions={[10, 20, 50]}
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No roles found.
        </p>
      }
    />
  )
}
