import type { LucideIcon } from "lucide-react"

type MetricCardProps = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: "teal" | "coral" | "indigo"
}

const toneStyles = {
  teal: "bg-[#c6eee8] text-(--primary)",
  coral: "bg-[#ffe0d6] text-[#9a3412]",
  indigo: "bg-[#e2e7ff] text-[#3730a3]",
} as const

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: MetricCardProps) {
  return (
    <article className="admin-dashboard-card flex min-w-0 items-center justify-between gap-3 p-3.5">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[0.12em] text-(--text-muted) uppercase">
          {label}
        </p>
        <p className="mt-1 truncate text-xl leading-tight font-bold text-(--text-primary) tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-(--text-muted)">
          {detail}
        </p>
      </div>
      <span
        className={`flex size-8 shrink-0 items-center justify-center rounded-md ${toneStyles[tone]}`}
        aria-hidden="true"
      >
        <Icon className="size-4" />
      </span>
    </article>
  )
}
