import type { LucideIcon } from "lucide-react"

type MetricCardProps = {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone: "teal" | "coral" | "indigo"
}

const toneStyles = {
  teal: "bg-brand-soft text-primary",
  coral: "bg-orange-100 text-orange-800",
  indigo: "bg-indigo-100 text-indigo-800",
} as const

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: MetricCardProps) {
  return (
    <article className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-border bg-card p-3.5">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </p>
        <p className="mt-1 truncate text-xl leading-tight font-bold text-foreground tabular-nums">
          {value}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
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
