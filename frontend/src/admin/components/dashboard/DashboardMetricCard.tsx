import type { ReactNode } from "react"

type Variant = "default" | "warning" | "success" | "danger"

const variantStyles: Record<Variant, { wrapper: string; value: string }> = {
  default: {
    wrapper: "border border-(--border-light) bg-(--bg-surface)",
    value: "text-(--text-primary)",
  },
  warning: {
    wrapper:
      "border border-(--border-light) border-l-4 border-l-amber-500 bg-amber-50/30",
    value: "text-amber-700",
  },
  success: {
    wrapper:
      "border border-(--border-light) border-l-4 border-l-emerald-500 bg-emerald-50/30",
    value: "text-emerald-700",
  },
  danger: {
    wrapper: "border border-(--border-light) bg-(--bg-surface)",
    value: "text-red-600",
  },
}

export function DashboardMetricCard({
  label,
  value,
  subText,
  subTextClassName,
  icon,
  badge,
  variant = "default",
}: {
  label: string
  value: ReactNode
  subText?: ReactNode
  subTextClassName?: string
  icon?: ReactNode
  badge?: ReactNode
  variant?: Variant
}) {
  const v = variantStyles[variant]
  return (
    <div className={`rounded-lg p-4 ${v.wrapper}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold tracking-wider text-(--text-muted) uppercase">
          {label}
        </span>
        {(badge || icon) && (
          <div className="flex items-center gap-1.5">
            {badge ? badge : null}
            {icon ? <span className="text-(--text-muted)">{icon}</span> : null}
          </div>
        )}
      </div>
      <div className={`mt-2 text-2xl font-bold tabular-nums ${v.value}`}>
        {value}
      </div>
      {subText && (
        <div
          className={`mt-1 text-xs text-(--text-muted) ${subTextClassName ?? ""}`}
        >
          {subText}
        </div>
      )}
    </div>
  )
}
