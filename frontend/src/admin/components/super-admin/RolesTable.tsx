import DataTable, { type TableColumn } from "react-data-table-component"
import { MoreVertical, Pencil, Trash2, Lock, Globe, Store } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { SuperAdminRole } from "../../types/superAdmin"
import { PortalActionMenu } from "../common/PortalActionMenu"

type RolesTableProps = {
  items: SuperAdminRole[]
  isLoading: boolean
  onEdit: (role: SuperAdminRole) => void
  onDelete: (role: SuperAdminRole) => void
}

function getDummyAvatars(count: number) {
  const colors = ["bg-emerald-600", "bg-blue-600", "bg-purple-600"]
  const initials = ["AR", "ZH", "MS", "FK", "TJ", "NK", "RB", "HM", "SK", "AZ"]
  const showCount = Math.min(3, count)

  const avatars = Array.from({ length: showCount }).map((_, i) => ({
    initials: initials[i % initials.length],
    color: colors[i % colors.length],
  }))

  return { avatars, remaining: count > 3 ? count - 3 : 0 }
}

export function RolesTable({
  items,
  isLoading,
  onEdit,
  onDelete,
}: RolesTableProps) {
  const columns: TableColumn<SuperAdminRole>[] = [
    {
      name: "ROLE NAME",
      minWidth: "280px",
      grow: 2,
      cell: (row) => {
        const isSystem = row.isSystem
        return (
          <div className="flex items-start gap-2 py-2">
            <span className="mt-1 shrink-0 text-(--text-muted)">
              {isSystem ? (
                <Lock className="size-3.5" />
              ) : (
                <div className="size-3.5" /> // Custom রোলের জন্য ফাঁকা জায়গা
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-(--text-primary)">
                  {row.displayName}
                </span>
                <span className="rounded border border-(--border-light) bg-(--bg-surface-hover) px-1.5 py-0.5 font-mono text-xs text-(--text-muted)">
                  {row.name}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-(--text-muted)">
                {row.description || "No description provided."}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      name: "SCOPE",
      width: "130px",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
            row.scope === "platform"
              ? "bg-blue-50 text-blue-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {row.scope === "platform" ? (
            <Globe className="size-3" />
          ) : (
            <Store className="size-3" />
          )}
          <span className="capitalize">{row.scope}</span>
        </span>
      ),
    },
    {
      name: "PERMISSIONS",
      minWidth: "180px",
      cell: (row) => {
        // পারমিশন কাউন্ট ক্যালকুলেশন
        const permCount = Object.values(row.permissions).flat().length
        // সুপার অ্যাডমিনের ক্ষেত্রে সব (৪৮/৪৮), অন্যদের ক্ষেত্রে পার্সেন্টেজ
        const isSuperAdmin = row.name === "super_admin"
        const percent = isSuperAdmin
          ? 100
          : Math.min(100, Math.round((permCount / 48) * 100))

        return (
          <div className="w-full pr-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <div className="mr-3 flex-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 font-medium text-(--text-primary)">
                {isSuperAdmin
                  ? `All (${permCount}/${permCount})`
                  : `${permCount} perms`}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      name: "USERS ASSIGNED",
      minWidth: "160px",
      cell: (row) => {
        if (row.userCount === 0) {
          return <span className="text-xs text-(--text-muted)">0 users</span>
        }

        const { avatars, remaining } = getDummyAvatars(row.userCount)

        return (
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {avatars.map((avatar, i) => (
                <span
                  key={i}
                  className={`flex size-6 items-center justify-center rounded-full border-2 border-(--bg-surface) text-[9px] font-bold text-white ${avatar.color}`}
                >
                  {avatar.initials}
                </span>
              ))}
              {remaining > 0 && (
                <span className="z-10 flex size-6 items-center justify-center rounded-full border-2 border-(--bg-surface) bg-(--bg-surface-hover) text-[9px] font-bold text-(--text-muted)">
                  +{remaining}
                </span>
              )}
            </div>
            <span className="ml-3 text-xs font-medium text-(--text-muted)">
              {row.userCount} users
            </span>
          </div>
        )
      },
    },
    {
      name: "TYPE",
      width: "110px",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${
            row.isSystem
              ? "bg-(--bg-table-header) text-(--text-muted)"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {row.isSystem ? (
            <Lock className="size-2.5" />
          ) : (
            <div className="size-2.5 rounded-sm border border-current" />
          )}
          {row.isSystem ? "System" : "Custom"}
        </span>
      ),
    },
    {
      name: "ACTIONS",
      minWidth: "200px",
      right: true,
      cell: (row) => {
        const isSuperAdmin = row.name === "super_admin"
        const canDelete = !row.isSystem && row.userCount === 0

        return (
          <div className="flex items-center justify-end gap-3">
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
                    {isSuperAdmin ? "View (locked)" : "Edit Role"}
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
          </div>
        )
      },
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
      selectableRows
      paginationRowsPerPageOptions={[10, 20, 50]}
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No roles found.
        </p>
      }
    />
  )
}
