import DataTable, { type TableColumn } from "react-data-table-component"
import {
  ImageOff,
  MoreVertical,
  Pencil,
  Ban,
  Trash2,
  Unlock,
} from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { formatTaka } from "../../lib/orderStatus"
import { PortalActionMenu } from "../common/PortalActionMenu"
import {
  getSuperAdminProductStatus,
  type SuperAdminProduct,
  type SuperAdminProductStatus,
} from "../../types/superAdminProduct"

const LOW_STOCK_THRESHOLD = 5

const statusChipStyles: Record<SuperAdminProductStatus, string> = {
  active: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
  inactive: "bg-(--bg-table-header) text-(--text-muted)",
  blocked: "bg-(--status-cancelled-bg) text-(--status-cancelled-text)",
}

const statusLabels: Record<SuperAdminProductStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
}

function StockCell({ product }: { product: SuperAdminProduct }) {
  const qty = product.stockQuantity
  if (qty === 0) {
    return (
      <span className="text-xs whitespace-nowrap text-red-600">
        Out of stock
      </span>
    )
  }
  if (qty < LOW_STOCK_THRESHOLD) {
    return (
      <span className="text-xs text-amber-700 tabular-nums">{qty} (low)</span>
    )
  }
  return (
    <span className="text-xs text-(--text-primary) tabular-nums">{qty}</span>
  )
}

export function SuperAdminProductsTable({
  products,
  isLoading = false,
  onEdit,
  onBlock,
  onUnblock,
  onDelete,
}: {
  products: SuperAdminProduct[]
  isLoading?: boolean
  onEdit: (product: SuperAdminProduct) => void
  onBlock: (product: SuperAdminProduct) => void
  onUnblock: (product: SuperAdminProduct) => void
  onDelete: (product: SuperAdminProduct) => void
}) {
  const columns: TableColumn<SuperAdminProduct>[] = [
    {
      name: "PRODUCT",
      minWidth: "260px",
      grow: 2,
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--border-light) bg-(--bg-app)">
            {row.images[0] ? (
              <img
                src={row.images[0]}
                alt={row.name}
                className="size-full object-cover"
              />
            ) : (
              <ImageOff className="size-4 text-(--text-muted)" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--text-primary)">
              {row.name}
            </p>
            <p className="truncate text-xs text-(--text-muted)">
              {row.brandName}
            </p>
          </div>
        </div>
      ),
    },
    {
      name: "SHOP",
      minWidth: "160px",
      cell: (row) => (
        <span className="inline-flex items-center rounded-md bg-(--bg-table-header) px-2 py-0.5 text-xs font-medium text-(--text-primary)">
          {row.shopName}
        </span>
      ),
    },
    {
      name: "CATEGORY",
      minWidth: "160px",
      cell: (row) => (
        <span className="text-xs text-(--text-muted)">{row.category}</span>
      ),
    },
    {
      name: "PRICE",
      minWidth: "140px",
      right: true,
      cell: (row) => {
        const selling = row.currentPrice
        const buying = row.buyingPrice ?? 0
        const profit = selling - buying
        const profitPct = buying > 0 ? Math.round((profit / buying) * 100) : 0

        return (
          <div className="flex flex-col items-end leading-tight">
            <span className="text-sm font-semibold text-(--text-primary) tabular-nums">
              {formatTaka(selling)}
            </span>
            {buying > 0 ? (
              <span className="text-[11px] text-(--text-muted) tabular-nums">
                Buy {formatTaka(buying)}
                <span
                  className={`ml-1 font-medium ${
                    profit >= 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  · {profit >= 0 ? "+" : ""}
                  {profitPct}%
                </span>
              </span>
            ) : (
              <span className="text-[11px] text-(--text-muted) italic">
                No cost set
              </span>
            )}
          </div>
        )
      },
    },
    {
      name: "STOCK",
      width: "100px",
      cell: (row) => <StockCell product={row} />,
    },
    {
      name: "STATUS",
      width: "120px",
      cell: (row) => {
        const status = getSuperAdminProductStatus(row)
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${statusChipStyles[status]}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {statusLabels[status]}
          </span>
        )
      },
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
          {(closeMenu) => {
            // Blocked → only Unblock
            if (row.isBlocked) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    onUnblock(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <Unlock className="size-3.5" />
                  Unblock Product
                </button>
              )
            }

            // Normal product → Edit, Block, Delete
            return (
              <>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    onEdit(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <Pencil className="size-3.5" />
                  Edit Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    onBlock(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-amber-700 transition-colors hover:bg-amber-50"
                >
                  <Ban className="size-3.5" />
                  Block Product
                </button>
                <button
                  type="button"
                  onClick={() => {
                    closeMenu()
                    onDelete(row)
                  }}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </>
            )
          }}
        </PortalActionMenu>
      ),
    },
  ]
  return (
    <DataTable
      columns={columns}
      data={products}
      progressPending={isLoading}
      customStyles={adminDataTableStyles}
      pagination
      paginationPerPage={20}
      paginationRowsPerPageOptions={[10, 20, 50]}
      noDataComponent={
        <p className="py-10 text-center text-sm text-(--text-muted)">
          No products found.
        </p>
      }
    />
  )
}
