import { formatTaka } from "../../lib/orderStatus"
import type { DashboardData } from "../../types/dashboard"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export function WeeklyChartCard({
  chart,
}: {
  chart: DashboardData["weeklyChart"]
}) {
  const labels = chart.days.map((item) => item.day)
  const data = chart.days.map((item) => item.count)
  const activeIndex = chart.days.findIndex((item) => item.active)

  const chartData = {
    labels,
    datasets: [
      {
        label: "Orders",
        data,
        borderRadius: 6,
        borderSkipped: false,
        backgroundColor: chart.days.map((_, index) =>
          index === activeIndex ? "#00685f" : "#cbd5e1"
        ),
        hoverBackgroundColor: chart.days.map((_, index) =>
          index === activeIndex ? "#008378" : "#94a3b8"
        ),
      },
    ],
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) =>
            `${context.parsed.y} order${context.parsed.y === 1 ? "" : "s"}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: "#64748b", font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#94a3b8",
          font: { size: 10 },
        },
        grid: { color: "#eef2f7" },
        border: { display: false },
      },
    },
  }

  return (
    <div className="space-y-4 rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-(--text-primary)">
            Orders in last 7 days
          </h3>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            {chart.totalOrders} orders • {formatTaka(chart.totalValue)} value
          </p>
        </div>
        <span className="text-xs font-medium text-(--text-muted)">
          {chart.dateRange}
        </span>
      </div>

      <div className="h-40">
        <Bar data={chartData} options={options} />
      </div>

      <div className="flex items-center justify-between pt-1 text-xs text-(--text-muted)">
        <span>Daily volume average</span>
        <span className="font-semibold text-(--text-primary) tabular-nums">
          {chart.dailyAverage} orders/day
        </span>
      </div>
    </div>
  )
}
