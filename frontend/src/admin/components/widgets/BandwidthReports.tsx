import { useState } from "react"
import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Line } from "react-chartjs-2"
import type { ChartOptions } from "chart.js"
import "../../lib/chartSetup"
import type {
  BandwidthReportTabData,
  BandwidthReportsProps,
} from "../../types/dashboard"

const chartOptions: ChartOptions<"line"> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
      text: "Chart.js Line Chart",
    },
  },
  scales: {
    x: {
      display: false,
      grid: {
        display: false,
      },
    },
    y: {
      display: false,
      grid: {
        display: false,
      },
    },
  },
  layout: {
    padding: {
      left: 10,
      right: 10,
      top: 10,
      bottom: 0,
    },
  },
}

const progressColorClass = {
  danger: "bg-[#d92550]",
  success: "bg-[#3ac47d]",
  primary: "bg-[#3f6ad8]",
  warning: "bg-[#f7b924]",
  info: "bg-[#16aaff]",
  alternate: "bg-[#794c8a]",
} as const

function BandwidthTab({ data }: { data: BandwidthReportTabData }) {
  const TrendIcon = data.trend.direction === "left" ? ArrowLeft : ArrowUpRight

  return (
    <div role="tabpanel" className="p-3 sm:p-4">
      <div className="admin-bandwidth-chart">
        <Line data={data.chart} options={chartOptions} />
      </div>
      <div
        className={`mt-4 flex flex-wrap items-center justify-center gap-1 text-center text-sm ${
          data.trend.color === "warning" ? "text-[#f7b924]" : "text-[#3ac47d]"
        }`}
      >
        <TrendIcon aria-hidden="true" className="h-4 w-4" />
        <span className="px-1">{data.trend.value}</span>
        <span className="text-gray-500 opacity-80">
          {data.trend.description}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.progressWidgets.map((widget) => (
          <div key={widget.id} className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl leading-none font-medium text-gray-500">
                {widget.value}%
              </span>
              <span className="truncate text-xs text-gray-500 opacity-70">
                {widget.label}
              </span>
            </div>
            <div
              className="mt-2 h-1 overflow-hidden rounded-sm bg-gray-200"
              role="progressbar"
              aria-label={widget.label}
              aria-valuenow={widget.value}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full ${progressColorClass[widget.color]}`}
                style={{ width: `${widget.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BandwidthReports({ data }: BandwidthReportsProps) {
  const [activeTab, setActiveTab] = useState<"first" | "second">("first")
  const tabs = [
    { id: "first", label: "Tab 1" },
    { id: "second", label: "Tab 2" },
  ] as const

  return (
    <section
      className="admin-dashboard-card min-w-0 overflow-hidden bg-white"
      aria-labelledby="bandwidth-reports-title"
    >
      <header className="flex min-h-[56px] items-center justify-between gap-2 border-b border-gray-200 px-4 sm:px-6">
        <h2
          id="bandwidth-reports-title"
          className="text-sm font-bold tracking-wide text-gray-600 uppercase"
        >
          Bandwidth Reports
        </h2>
        <div
          className="flex shrink-0 items-center gap-1"
          role="tablist"
          aria-label="Bandwidth report view"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`bandwidth-${tab.id}-tab`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="bandwidth-report-panel"
              className={`rounded-full px-3 py-2 text-xs transition-colors sm:px-4 ${
                activeTab === tab.id
                  ? "bg-[#3f6ad8] text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>
      <div
        id="bandwidth-report-panel"
        aria-labelledby={`bandwidth-${activeTab}-tab`}
      >
        <BandwidthTab data={data[activeTab]} />
      </div>
    </section>
  )
}

export default BandwidthReports
