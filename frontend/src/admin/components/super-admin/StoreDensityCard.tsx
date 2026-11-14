import { MapPin, RefreshCcw, ArrowRight } from "lucide-react"

const densityData = [
  { name: "Dhaka Metropolitan", stores: 21, percent: 50 },
  { name: "Chittagong Port & City", stores: 10, percent: 24 },
  { name: "Sylhet & Tea Valley", stores: 6, percent: 14 },
  { name: "Rajshahi & Khulna Zones", stores: 5, percent: 12 },
]

export function StoreDensityCard() {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Store Density by Region
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Active supplement hubs distribution across administrative
              divisions
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-700">
            <MapPin className="size-3" /> 8 Divisions
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {densityData.map((item) => (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-(--text-primary)">
                  {item.name}
                </span>
                <span className="text-(--text-muted)">
                  {item.stores} stores ({item.percent}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-(--border-light) pt-3 text-xs text-(--text-muted)">
        <span className="flex items-center gap-1.5">
          <RefreshCcw className="size-3" /> Sync interval: 5m automated
        </span>
        <button className="flex items-center gap-1 font-medium text-primary hover:underline">
          View division telemetry <ArrowRight className="size-3" />
        </button>
      </div>
    </div>
  )
}
