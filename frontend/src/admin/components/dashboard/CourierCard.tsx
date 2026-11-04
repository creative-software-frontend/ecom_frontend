import { formatTaka } from "../../lib/orderStatus"
import type { DashboardData } from "../../types/dashboard"

export function CourierCard({
  courier,
}: {
  courier: DashboardData["courierSummary"]
}) {
  return (
    <div className="space-y-4 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between border-b border-(--border-light) pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded bg-emerald-100 text-xs font-bold text-emerald-800">
            🚚
          </span>
          <span className="text-sm font-semibold text-(--text-primary)">
            Courier — Ready for pickup
          </span>
        </div>
        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
          Shipped
        </span>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-(--border-light) bg-(--bg-table-header) p-3">
        <div>
          <div className="text-xs font-bold text-(--text-muted) uppercase">
            Ready for Pickup
          </div>
          <div className="mt-0.5 text-xl font-bold text-(--text-primary) tabular-nums">
            {courier.readyForPickup} parcels
          </div>
        </div>
        <div className="max-w-35 text-right text-xs text-(--text-muted)">
          Hand over to courier from Orders page
        </div>
      </div>

      <div className="space-y-2 divide-y divide-(--border-light) text-xs text-(--text-muted)">
        <div className="flex justify-between pt-1">
          <span>Inside Dhaka:</span>
          <span className="font-semibold text-(--text-primary) tabular-nums">
            {courier.insideDhaka} parcels
          </span>
        </div>
        <div className="flex justify-between pt-2">
          <span>Outside Dhaka:</span>
          <span className="font-semibold text-(--text-primary) tabular-nums">
            {courier.outsideDhaka} parcels
          </span>
        </div>
        <div className="flex justify-between pt-2 font-medium">
          <span>Total COD pending:</span>
          <span className="font-semibold text-primary tabular-nums">
            {formatTaka(courier.totalCod)}
          </span>
        </div>
      </div>
    </div>
  )
}
