import { useState } from "react"
import { Bar } from "react-chartjs-2"
import type { ChartOptions } from "chart.js"
import "../../lib/chartSetup"
import type {
  SalesReportProps,
  SalesReportTabData,
} from "../../types/dashboard"

const lastChartOptions: ChartOptions<"bar"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top",
    },
    title: {
      display: false,
      text: "Chart.js Verticle Bar Chart",
    },
  },
}

const currentChartOptions: ChartOptions<"bar"> = {
  indexAxis: "y",
  elements: {
    bar: {
      borderWidth: 2,
    },
  },
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
    },
    title: {
      display: false,
      text: "Chart.js Horizontal Bar Chart",
    },
  },
}

function SalesReportTab({
  data,
  horizontal,
}: {
  data: SalesReportTabData
  horizontal: boolean
}) {
  return (
    <div>
      <div className="admin-sales-chart">
        <Bar
          data={data.chart}
          options={horizontal ? currentChartOptions : lastChartOptions}
        />
      </div>
      <h3 className="mb-2 text-xs font-normal tracking-wide text-gray-500 uppercase opacity-70">
        {data.listTitle}
      </h3>
      <ul className="admin-sales-list">
        {data.entries.map((entry) => (
          <li
            key={entry.id}
            className="border-b border-gray-200 last:border-b-0"
          >
            <div className="flex items-center gap-3 py-3">
              <img
                className="h-[42px] w-[42px] shrink-0 rounded-full object-cover"
                src={entry.avatar}
                alt=""
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-gray-700">
                  {entry.name}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {entry.subtitle}
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-2 text-lg text-gray-500">
                <span>${entry.value}</span>
                <span
                  aria-label={
                    entry.trend === "up"
                      ? "Trending up"
                      : entry.trend === "down"
                        ? "Trending down"
                        : "No change"
                  }
                  className={
                    entry.trend === "up"
                      ? "text-[#3ac47d]"
                      : entry.trend === "down"
                        ? "text-[#d92550]"
                        : "text-[#f7b924]"
                  }
                >
                  {entry.trend === "up"
                    ? "↑"
                    : entry.trend === "down"
                      ? "↓"
                      : "•"}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SalesReport({ data }: SalesReportProps) {
  const [activeTab, setActiveTab] = useState<"last" | "current">("last")

  return (
    <section
      className="admin-dashboard-card min-w-0 overflow-hidden bg-white"
      aria-labelledby="sales-report-title"
    >
      <header className="flex min-h-[56px] items-center justify-between border-b border-gray-200 px-4 sm:px-6">
        <h2
          id="sales-report-title"
          className="text-sm font-bold tracking-wide text-gray-600 uppercase"
        >
          Sales Report
        </h2>
        <div
          className="flex items-center gap-1"
          role="tablist"
          aria-label="Sales report period"
        >
          <button
            type="button"
            id="sales-report-last-tab"
            role="tab"
            aria-selected={activeTab === "last"}
            aria-controls="sales-report-panel"
            className={`min-w-14 border-b-2 px-3 py-4 text-sm transition-colors ${
              activeTab === "last"
                ? "border-[#3f6ad8] text-[#3f6ad8]"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("last")}
          >
            Last
          </button>
          <button
            type="button"
            id="sales-report-current-tab"
            role="tab"
            aria-selected={activeTab === "current"}
            aria-controls="sales-report-panel"
            className={`min-w-14 border-b-2 px-3 py-4 text-sm transition-colors ${
              activeTab === "current"
                ? "border-[#3f6ad8] text-[#3f6ad8]"
                : "border-transparent text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("current")}
          >
            Current
          </button>
        </div>
      </header>
      <div
        id="sales-report-panel"
        className="p-4 sm:p-6"
        role="tabpanel"
        aria-labelledby={
          activeTab === "last"
            ? "sales-report-last-tab"
            : "sales-report-current-tab"
        }
      >
        <SalesReportTab
          data={data[activeTab]}
          horizontal={activeTab === "current"}
        />
      </div>
    </section>
  )
}

export default SalesReport
