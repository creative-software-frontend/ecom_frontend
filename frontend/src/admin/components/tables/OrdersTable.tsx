import { Link } from "react-router"
import { Phone, MessageCircle, Eye } from "lucide-react"
import { StatusBadge } from "../common/StatusBadge"
import { EmptyState } from "../common/EmptyState"
import type { OrderListItem } from "../../types/order"
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../../lib/orderStatus"

type OrdersTableProps = {
  items: OrderListItem[]
  hasFilters: boolean
  onClearFilters: () => void
  searchParamsString: string
}

export function OrdersTable({
  items,
  hasFilters,
  onClearFilters,
  searchParamsString,
}: OrdersTableProps) {
  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-[13px] text-[var(--text-muted)]">
        {hasFilters ? (
          <EmptyState
            className="flex flex-col items-center gap-3"
            title="No orders match your filters."
            titleElement="span"
            action={
              <button
                type="button"
                onClick={onClearFilters}
                className="rounded-lg bg-slate-100 px-4 py-2 font-medium text-slate-600 hover:bg-slate-200"
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No orders yet."
            titleElement="span"
            wrapper={false}
          />
        )}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
        <thead className="bg-[var(--bg-table-header)]">
          <tr>
            {[
              "Order #",
              "Date & Time",
              "Customer",
              "Area",
              "Items",
              "Total",
              "Payment",
              "Status",
              "Actions",
            ].map((header, i) => (
              <th
                key={header}
                className={`border-b border-[var(--border-light)] px-4 py-3 text-[12px] font-medium text-[var(--text-muted)] ${i > 3 && i < 8 ? "text-center" : i === 5 ? "text-right" : ""}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-light)]">
          {items.map((order) => {
            const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
            const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
            return (
              <tr
                key={order.id}
                className="group transition-colors hover:bg-[var(--bg-surface-hover)]"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <Link
                    to={`/admin/orders/${order.id}`}
                    state={{ q: searchParamsString }}
                    className="font-semibold text-[var(--primary)] tabular-nums hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-[var(--text-muted)]">
                  <div className="font-medium text-[var(--text-primary)]">
                    {formatOrderDate(order.createdAt).split(",")[0]}
                  </div>
                  <div className="text-[11px]">
                    {formatOrderDate(order.createdAt).split(",")[1]}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-semibold text-[var(--text-primary)]">
                    {order.customerName}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                    {order.customerPhone}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="inline-flex items-center rounded bg-[var(--bg-table-header)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)]">
                    {order.deliveryArea}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-[var(--text-muted)] tabular-nums">
                  {order.itemCount}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)] tabular-nums">
                  {formatTaka(order.total)}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge variant={payCfg.variant} label={payCfg.label} />
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge
                    variant={orderCfg.variant}
                    label={orderCfg.label}
                  />
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-table-header)] hover:text-[var(--primary)]"
                      title="Call"
                    >
                      <Phone size={16} />
                    </a>
                    <a
                      href={`https://wa.me/88${order.customerPhone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-table-header)] hover:text-[var(--primary)]"
                      title="WhatsApp"
                    >
                      <MessageCircle size={16} />
                    </a>
                    <Link
                      to={`/admin/orders/${order.id}`}
                      state={{ q: searchParamsString }}
                      className="rounded p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-table-header)] hover:text-[var(--text-primary)]"
                      title="View"
                    >
                      <Eye size={16} />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
