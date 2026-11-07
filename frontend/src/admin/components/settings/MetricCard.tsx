import type { ReactNode } from "react"

/* Reusable compact metric card.
   Used by CouponsTab; can be adopted by Dashboard/Reports later. */
export function MetricCard({
  label,
  value,
  icon,
  iconBgClass,
  iconColorClass,
  showDot = false,
}: {
  label: string
  value: number | string
  icon: ReactNode
  iconBgClass: string
  iconColorClass: string
  showDot?: boolean
}) {
  return (
    <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {/* Optional status dot before label (used by Active/Paused/Expired) */}
          {showDot && (
            <span
              className={`size-1.5 shrink-0 rounded-full ${iconColorClass.replace("text-", "bg-")}`}
            />
          )}
          <span className="truncate text-xs font-semibold text-(--text-primary)">
            {label}
          </span>
        </div>
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-md ${iconBgClass} ${iconColorClass}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-(--text-primary) tabular-nums">
        {value}
      </div>
    </div>
  )
}
