import { Info } from "lucide-react"
import type { CategorySummary } from "../../types/superAdmin"

export function TopVerticalsCard({
  categories,
  totalSkus,
}: {
  categories: CategorySummary[]
  totalSkus: number
}) {
  // Cumulative share after each category — used to build the conic-gradient.
  const cumulative = categories.map((_, i) =>
    categories.slice(0, i + 1).reduce((sum, c) => sum + c.share, 0)
  )
  const gradientStops = categories
    .map((c, i) => {
      const start = i === 0 ? 0 : cumulative[i - 1]
      return `${c.color} ${start}% ${cumulative[i]}%`
    })
    .join(", ")

  const leading = categories[0]

  return (
    <div className="flex flex-col justify-between rounded-md border border-(--border-light) bg-(--bg-surface) p-5">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Top Product Categories
            </h3>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Share of units sold across tenant catalogues
            </p>
          </div>
          <Info className="size-4 text-(--text-muted)" />
        </div>

        {categories.length === 0 ? (
          <p className="py-10 text-center text-xs text-(--text-muted)">
            No category data yet.
          </p>
        ) : (
          <div className="mt-6 flex items-center justify-between gap-4">
            {/* CSS Donut Chart */}
            <div
              className="relative flex size-28 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${gradientStops})` }}
            >
              <div className="flex size-16 flex-col items-center justify-center rounded-full bg-(--bg-surface)">
                <span className="text-sm font-bold text-(--text-primary) tabular-nums">
                  {totalSkus.toLocaleString("en-BD")}
                </span>
                <span className="text-[9px] font-medium text-(--text-muted) uppercase">
                  SKUs
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {categories.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="size-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: c.color }}
                    />
                    <span className="truncate text-(--text-primary)">
                      {c.name}
                    </span>
                  </div>
                  <span className="shrink-0 font-medium text-(--text-muted) tabular-nums">
                    {c.share}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leading category banner */}
      <div className="mt-6 flex items-start gap-2 rounded-md border border-(--border-light) bg-(--bg-app) p-2.5">
        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
        <div className="flex flex-1 items-start justify-between gap-2">
          <div>
            <p className="text-xs text-(--text-muted)">Leading category:</p>
            <p className="text-xs font-medium text-(--text-primary)">
              {leading?.name ?? "—"}
            </p>
          </div>
          {leading && (
            <span className="text-xs font-bold text-emerald-600">
              {leading.share}% share
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
