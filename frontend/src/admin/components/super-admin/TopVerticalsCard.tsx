import { Info } from "lucide-react"

const verticals = [
  { name: "Ashwagandha & Vitality", percent: "52%", color: "#00685f" }, // primary
  { name: "Black Seed & Honey", percent: "28%", color: "#475569" }, // slate-600
  { name: "Organic Tonics", percent: "20%", color: "#b45309" }, // amber-700
]

export function TopVerticalsCard() {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Top Herbal Verticals
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Dominant product types across tenant catalogs
            </p>
          </div>
          <Info className="size-4 text-(--text-muted)" />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          {/* CSS Donut Chart */}
          <div
            className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "conic-gradient(#00685f 0% 52%, #475569 52% 80%, #b45309 80% 100%)",
            }}
          >
            <div className="flex size-16 flex-col items-center justify-center rounded-full bg-(--bg-surface)">
              <span className="text-sm font-bold text-(--text-primary) tabular-nums">
                1,840
              </span>
              <span className="text-[9px] font-medium text-(--text-muted) uppercase">
                SKUs
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {verticals.map((v) => (
              <div
                key={v.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-sm"
                    style={{ backgroundColor: v.color }}
                  />
                  <span className="text-(--text-primary)">{v.name}</span>
                </div>
                <span className="font-medium text-(--text-muted)">
                  {v.percent}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courier Info Banner */}
      <div className="mt-6 flex items-start gap-2 rounded-md border border-(--border-light) bg-(--bg-app) p-2.5">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
        <div className="flex flex-1 items-start justify-between gap-2">
          <div>
            <p className="text-xs text-(--text-muted)">
              National Courier Gateways:
            </p>
            <p className="text-xs font-medium text-(--text-primary)">
              RedX, Steadfast, Pathao
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600">
            99.8% Online
          </span>
        </div>
      </div>
    </div>
  )
}
