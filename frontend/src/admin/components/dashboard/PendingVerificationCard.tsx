import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import type { PendingOrderItem } from "../../types/dashboard"

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
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-(--border-light) bg-(--bg-table-header) text-xs font-semibold text-(--text-muted) uppercase">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Customer / Phone</th>
                <th className="px-4 py-3">Area</th>
                <th className="px-4 py-3">Items</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-light)">
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <td className="px-4 py-3 font-medium text-primary">
                    <Link
                      to={`/admin/orders/${order.id}`}
                      className="hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-(--text-muted) tabular-nums">
                    {order.placedTime}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-(--text-primary)">
                      {order.customerName}
                    </div>
                    <div className="text-xs text-(--text-muted) tabular-nums">
                      {order.customerPhone}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded bg-(--bg-table-header) px-2 py-1 text-xs font-medium text-(--text-primary)">
                      {order.deliveryArea}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-(--text-primary)">
                    {order.itemSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-light) bg-(--bg-table-header) px-4 py-3 text-xs text-(--text-muted)">
        <span>● Items held from dispatch until verified</span>
        <span className="font-medium">SLA target: &lt; 30 mins</span>
      </div>
    </div>
  )
}
