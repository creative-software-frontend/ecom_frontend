import DataTable, { type TableColumn } from "react-data-table-component"
import {
  MoreVertical,
  ExternalLink,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { formatDate } from "../../lib/formatTime"
import type { SuperAdminShopListItem } from "../../types/superAdmin"
import { PortalActionMenu } from "../common/PortalActionMenu"

const statusConfig = {
  active: {
    label: "Active",
    className: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
  },
  trial: {
    label: "Trial",
    className: "bg-(--status-pending-bg) text-(--status-pending-text)",
  },
  inactive: {
    label: "Suspended",
    className: "bg-(--status-cancelled-bg) text-(--status-cancelled-text)",
  },
}

type ShopsTableProps = {
  items: SuperAdminShopListItem[]
  isLoading: boolean
  onEdit: (shop: SuperAdminShopListItem) => void
  onToggleStatus: (shop: SuperAdminShopListItem) => void
}

export function ShopsTable({
  items,
  isLoading,
  onEdit,
  onToggleStatus,
}: ShopsTableProps) {
  const columns: TableColumn<SuperAdminShopListItem>[] = [
    {
      name: "SHOP DETAILS",
      minWidth: "220px",
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            {row.name.substring(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--text-primary)">
              {row.name}
            </p>
            <a
              href="#"
              className="flex items-center gap-1 text-xs text-(--text-muted) hover:text-primary"
            >
              {row.slug}.powerzenox.com <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      ),
    },
    {
      name: "OWNER INFO",
      minWidth: "180px",
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-(--text-primary)">
            {row.ownerName}
          </p>
          <p className="truncate text-xs text-(--text-muted)">
            {row.ownerMobile}
          </p>
        </div>
      ),
    },
    {
      name: "STATUS",
      width: "140px",
      cell: (row) => {
        const cfg = statusConfig[row.status] || statusConfig.inactive
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${cfg.className}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {cfg.label}
          </span>
        )
      },
    },
    {
      name: "PLAN & EXPIRY",
      minWidth: "200px",
      cell: (row) => (
        <div>
          <p className="text-sm text-(--text-primary)">{row.planName}</p>
          <p className="text-xs text-(--text-muted)">
            {row.expiresAt
              ? `Expires ${formatDate(row.expiresAt)}`
              : "No expiry"}
          </p>
        </div>
      ),
    },
    {
      name: "USERS",
      width: "100px",
      cell: (row) => (
        <span className="text-xs font-medium text-(--text-primary) tabular-nums">
          {row.userCount} users
        </span>
      ),
    },
    {
      name: "",
      width: "56px",
      right: true,
      cell: (row) => {
        const isActive = row.status === "active"
        const isTrial = row.status === "trial"

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
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    closeMenu()
                    onEdit(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <Pencil className="size-3.5" />
                  Edit Shop
                </button>

                {isActive && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu()
                      onToggleStatus(row)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50"
                  >
                    <PowerOff className="size-3.5" />
                    Suspend
                  </button>
                )}

                {!isActive && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      closeMenu()
                      onToggleStatus(row)
                    }}
                    className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--primary) transition-colors hover:bg-(--bg-surface-hover)"
                  >
                    <Power className="size-3.5" />
                    {isTrial ? "Promote to Active" : "Activate"}
                  </button>
                )}
              </>
            )}
          </PortalActionMenu>
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
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No shops found.
        </p>
      }
    />
  )
}
