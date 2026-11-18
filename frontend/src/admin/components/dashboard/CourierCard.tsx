import { formatTaka } from "../../lib/orderStatus"
import type { DashboardData } from "../../types/dashboard"
import {
  ArcElement,
  Chart as ChartJS,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend)

export function CourierCard({
  courier,
  payment,
}: {
  courier: DashboardData["courierSummary"]
  payment: DashboardData["metrics"]["newOrdersToday"]
}) {
  const paymentTotal = payment.cod + payment.bkash
  const paymentChartData = {
    labels: ["COD", "Digital payment"],
    datasets: [
      {
        data: [payment.cod, payment.bkash],
        backgroundColor: ["#f59e0b", "#2563eb"],
        borderColor: ["#ffffff", "#ffffff"],
        borderWidth: 3,
        hoverOffset: 4,
      },
    ],
  }
  const paymentOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.label}: ${context.parsed}${paymentTotal > 0 ? ` (${Math.round((context.parsed / paymentTotal) * 100)}%)` : ""}`,
        },
      },
    },
  }

  return (
    <div className="space-y-4 rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between border-b border-(--border-light) pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded bg-emerald-100 text-xs font-bold text-emerald-800">
            🚚
          </span>
          <span className="text-sm font-semibold text-(--text-primary)">
            Courier — Ready for pickup
          </span>
        </div>
        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
          Shipped
        </span>
      </div>

      <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-table-header) p-3">
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

        <div className="border-t border-(--border-light) pt-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-(--text-primary)">
              Today&apos;s payment mix
            </span>
            <span className="text-[11px] text-(--text-muted)">
              {paymentTotal} orders
            </span>
          </div>
          <div className="grid grid-cols-[92px_1fr] items-center gap-3">
            <div className="relative h-[92px]">
              <Doughnut data={paymentChartData} options={paymentOptions} />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-(--text-primary)">
                {paymentTotal}
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-(--text-muted)">
                  <span className="size-2 rounded-full bg-amber-500" />
                  COD
                </span>
                <span className="font-semibold text-(--text-primary) tabular-nums">
                  {payment.cod}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-(--text-muted)">
                  <span className="size-2 rounded-full bg-blue-600" />
                  Digital
                </span>
                <span className="font-semibold text-(--text-primary) tabular-nums">
                  {payment.bkash}
                </span>
              </div>
            </div>
          </div>
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
