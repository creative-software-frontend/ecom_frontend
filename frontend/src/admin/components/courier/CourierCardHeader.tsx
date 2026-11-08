import type { ReactNode } from "react"

/* Reusable card header used by Delivery Zones + API Credentials cards. */
export function CourierCardHeader({
  icon,
  title,
  subtitle,
  badge,
  right,
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  badge?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--border-light) p-4">
      <div className="flex min-w-0 items-start gap-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-(--text-primary)">
              {title}
            </h2>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  )
}
