import { Link } from "react-router"
import DataTable, { type TableColumn } from "react-data-table-component"
import { ArrowRight } from "lucide-react"
import type { PendingOrderItem } from "../../types/dashboard"
import { adminDataTableStyles } from "../../lib/dataTableStyles"

const pendingOrderColumns: TableColumn<PendingOrderItem>[] = [
  {
    name: "Order #",
    selector: (order) => order.orderNumber,
    minWidth: "120px",
    cell: (order) => (
      <Link
        to={`/admin/orders/${order.id}`}
        className="font-medium text-primary hover:underline"
      >
        {order.orderNumber}
      </Link>
    ),
  },
  {
    name: "Placed",
    selector: (order) => order.placedTime,
    minWidth: "100px",
    cell: (order) => (
      <span className="text-xs text-(--text-muted) tabular-nums">
        {order.placedTime}
      </span>
    ),
  },
  {
    name: "Customer / Phone",
    selector: (order) => order.customerName,
    minWidth: "180px",
    cell: (order) => (
      <div>
        <div className="font-medium text-(--text-primary)">
          {order.customerName}
        </div>
        <div className="text-xs text-(--text-muted) tabular-nums">
          {order.customerPhone}
        </div>
      </div>
    ),
  },
  {
    name: "Area",
    selector: (order) => order.deliveryArea,
    minWidth: "120px",
    cell: (order) => (
      <span className="inline-flex rounded bg-(--bg-table-header) px-2 py-1 text-xs font-medium text-(--text-primary)">
        {order.deliveryArea}
      </span>
    ),
  },
  {
    name: "Items",
    selector: (order) => order.itemSummary,
    minWidth: "180px",
    cell: (order) => (
      <span className="font-medium text-(--text-primary)">
        {order.itemSummary}
      </span>
    ),
  },
]

export function PendingVerificationCard({
  orders,
  totalPending,
}: {
  orders: PendingOrderItem[]
  totalPending: number
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) bg-(--bg-table-header) px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-(--text-primary)">
            Needs attention — Pending phone verification
          </span>
          {orders.length > 0 && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {orders.length} urgent
            </span>
          )}
        </div>
        <Link
          to="/admin/orders?status=pending"
          className="flex items-center gap-1 text-xs font-medium whitespace-nowrap text-primary hover:underline"
        >
          View all {totalPending} pending <ArrowRight className="size-3" />
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-(--text-muted)">
          🎉 No pending orders — all caught up!
        </div>
      ) : (
        <DataTable
          className="admin-data-table"
          keyField="id"
          columns={pendingOrderColumns}
          data={orders}
          customStyles={adminDataTableStyles}
          pagination={false}
          responsive
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-light) bg-(--bg-table-header) px-4 py-3 text-xs text-(--text-muted)">
        <span>● Items held from dispatch until verified</span>
        <span className="font-medium">SLA target: &lt; 30 mins</span>
      </div>
    </div>
  )
}
