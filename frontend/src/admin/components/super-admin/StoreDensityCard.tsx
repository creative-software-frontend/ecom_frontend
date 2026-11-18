import { MapPin, RefreshCcw, ArrowRight } from "lucide-react"
import type { DivisionSummary } from "../../data/shopSummaryMock"

export function StoreDensityCard({
  divisions,
}: {
  divisions: DivisionSummary[]
}) {
  const totalShops = divisions.reduce((sum, d) => sum + d.shops, 0)

  return (
    <div className="flex flex-col justify-between rounded-md border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Store Density by Division
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Shop distribution across administrative divisions
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-emerald-700">
            <MapPin className="size-3" /> {divisions.length} Divisions
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {divisions.length === 0 ? (
            <p className="py-6 text-center text-xs text-(--text-muted)">
              No shop data yet.
            </p>
          ) : (
            divisions.map((item) => {
              const percent =
                totalShops > 0 ? Math.round((item.shops / totalShops) * 100) : 0
              return (
                <div key={item.division}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-(--text-primary)">
                      {item.division}
                    </span>
                    <span className="text-(--text-muted)">
                      {item.shops} shops ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-(--bg-surface-hover)">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
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
