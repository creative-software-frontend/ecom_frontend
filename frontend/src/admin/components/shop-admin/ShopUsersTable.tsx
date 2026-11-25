import DataTable, { type TableColumn } from "react-data-table-component"
import { MoreVertical, Pencil, KeyRound, Power, PowerOff } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { PortalActionMenu } from "../common/PortalActionMenu"
import { getInitials } from "../../lib/initials"
import { relativeTime } from "../../lib/formatTime"
import type { ShopUserItem } from "../../api/shopUsersApi"

export type ShopUser = ShopUserItem

const roleBadgeMap: Record<string, string> = {
  shop_admin: "bg-teal-50 text-teal-700",
  salesman: "bg-purple-50 text-purple-700",
  order_handler: "bg-blue-50 text-blue-700",
  product_uploader: "bg-indigo-50 text-indigo-700",
}

export function ShopUsersTable({
  users,
  currentUserId,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: {
  users: ShopUser[]
  currentUserId: number
  onEdit: (u: ShopUser) => void
  onResetPassword: (u: ShopUser) => void
  onToggleStatus: (u: ShopUser) => void
}) {
  const columns: TableColumn<ShopUser>[] = [
    {
      name: "USER",
      minWidth: "280px",
      grow: 2,
      cell: (row) => {
        const isSelf = row.id === currentUserId
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
                {isSelf && (
                  <span className="rounded bg-(--bg-surface-hover) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
                    You
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-(--text-muted)">
                {row.email} <span className="mx-1">•</span> {row.mobile}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      name: "ROLE",
      minWidth: "140px",
      cell: (row) => (
        <span
          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${roleBadgeMap[row.role] || "bg-gray-100 text-gray-800"}`}
        >
          {row.roleDisplayName}
        </span>
      ),
    },
    {
      name: "STATUS",
      width: "110px",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${row.status === "active" ? "text-emerald-700" : "text-amber-700"}`}
        >
          <span
            className={`size-1.5 rounded-full ${row.status === "active" ? "bg-emerald-500" : "bg-amber-500"}`}
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
      cell: (row) => {
        const isSelf = row.id === currentUserId
        const isShopAdmin = row.role === "shop_admin"

        if (isSelf || isShopAdmin) {
          return <span className="text-xs text-(--text-muted)">—</span>
        }
        return (
          <PortalActionMenu
            label={`Actions for ${row.name}`}
            trigger={<MoreVertical className="size-4" />}
            triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
            menuClassName="w-44"
          >
            {(closeMenu) => (
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
                    onResetPassword(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
                >
                  <KeyRound className="size-3.5" /> Reset Password
                </button>
                <button
                  onClick={() => {
                    closeMenu()
                    onToggleStatus(row)
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover) ${row.status === "active" ? "text-red-600" : "text-(--primary)"}`}
                >
                  {row.status === "active" ? (
                    <>
                      <PowerOff className="size-3.5" /> Deactivate Staff
                    </>
                  ) : (
                    <>
                      <Power className="size-3.5" /> Activate Staff
                    </>
                  )}
                </button>
              </>
            )}
          </PortalActionMenu>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      customStyles={adminDataTableStyles}
      pagination
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No users found.
        </p>
      }
    />
  )
}
