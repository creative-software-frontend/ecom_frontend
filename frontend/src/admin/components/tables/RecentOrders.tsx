import { useState } from "react"
import { Trash2 } from "lucide-react"
import type {
  RecentOrder,
  RecentOrderStatus,
  RecentOrdersProps,
} from "../../types/dashboard"

const statusClass: Record<RecentOrderStatus, string> = {
  Pending: "bg-[#f7b924] text-white",
  Completed: "bg-[#3ac47d] text-white",
  "In Progress": "bg-[#d92550] text-white",
  "On Hold": "bg-[#16aaff] text-white",
}

function OrderRow({ order }: { order: RecentOrder }) {
  return (
    <tr className="border-t border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-gray-500">
        {order.number}
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-[210px] items-center gap-3">
          <img
            className="h-10 w-10 shrink-0 rounded-full object-cover"
            src={order.avatar}
            alt=""
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-gray-700">
              {order.name}
            </div>
            <div className="truncate text-xs text-gray-500">
              {order.subtitle}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm whitespace-nowrap text-gray-600">
        {order.city}
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-flex rounded px-2 py-1 text-xs font-medium ${statusClass[order.status]}`}
        >
          {order.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          className="rounded bg-[#3f6ad8] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3458b5]"
          aria-label={`View details for order ${order.number}`}
        >
          Details
        </button>
      </td>
    </tr>
  )
}

export function RecentOrders({ data }: RecentOrdersProps) {
  const [activePeriod, setActivePeriod] = useState<"lastWeek" | "allMonth">(
    "lastWeek"
  )

  return (
    <section
      className="admin-dashboard-card min-w-0 overflow-hidden bg-white"
      aria-labelledby="recent-orders-title"
    >
      <header className="flex min-h-[56px] items-center justify-between gap-3 border-b border-gray-200 px-4 py-2 sm:px-6">
        <h2
          id="recent-orders-title"
          className="text-sm font-bold text-gray-700"
        >
          {data.title}
        </h2>
        <div
          className="flex shrink-0"
          role="group"
          aria-label="Recent orders period"
        >
          <button
            type="button"
            aria-pressed={activePeriod === "lastWeek"}
            className={`rounded-l px-3 py-2 text-xs font-medium transition-colors ${
              activePeriod === "lastWeek"
                ? "bg-[#3f6ad8] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setActivePeriod("lastWeek")}
          >
            Last Week
          </button>
          <button
            type="button"
            aria-pressed={activePeriod === "allMonth"}
            className={`rounded-r px-3 py-2 text-xs font-medium transition-colors ${
              activePeriod === "allMonth"
                ? "bg-[#3f6ad8] text-white"
                : "bg-gray-100 text-gray-600"
            }`}
            onClick={() => setActivePeriod("allMonth")}
          >
            All Month
          </button>
        </div>
      </header>
      <div className="admin-orders-scroll w-full min-w-0 overflow-x-auto">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
              >
                #
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-xs font-bold tracking-wide text-gray-600 uppercase"
              >
                Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
              >
                City
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data[activePeriod].map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-center gap-3 border-t border-gray-200 p-4">
        <button
          type="button"
          aria-label="Delete selected orders"
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d92550] text-[#d92550] transition-colors hover:bg-[#d92550] hover:text-white"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded bg-[#3ac47d] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ba968]"
        >
          Save
        </button>
      </footer>
    </section>
  )
}

export default RecentOrders
