export type StatusBadgeVariant =
  | "active"
  | "inactive"
  | "in-stock"
  | "low-stock"
  | "out-of-stock"
  | "warning"
  | "info"
  | "primary"
  | "success"
  | "danger"
  | "delivered"

type StatusBadgeProps = {
  variant: StatusBadgeVariant
  label: string
  className?: string
  ariaLive?: "off" | "polite" | "assertive"
}

const variantStyles: Record<StatusBadgeVariant, string> = {
  warning: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-800",
  primary: "bg-indigo-100 text-indigo-800",
  success: "bg-emerald-100 text-emerald-800",
  danger: "bg-red-100 text-red-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-red-100 text-red-800",
  "in-stock": "bg-emerald-100 text-emerald-800",
  "low-stock": "bg-amber-100 text-amber-800",
  "out-of-stock": "bg-red-100 text-red-800",
  delivered: "bg-emerald-100 text-emerald-800",
}

const dotStyles: Partial<Record<StatusBadgeVariant, string>> = {
  warning: "bg-amber-600",
  info: "bg-blue-600",
  primary: "bg-indigo-600",
  success: "bg-emerald-600",
  danger: "bg-red-600",
  active: "bg-emerald-600",
  inactive: "bg-red-600",
  "in-stock": "bg-emerald-600",
  "low-stock": "bg-amber-600",
  "out-of-stock": "bg-red-600",
  delivered: "bg-emerald-600",
}

export function StatusBadge({
  variant,
  label,
  className,
  ariaLive,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${variantStyles[variant] ?? variantStyles.warning} ${className ?? ""}`}
      aria-live={ariaLive}
    >
      {dotStyles[variant] && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[variant]}`} />
      )}
      {label}
    </span>
  )
}
