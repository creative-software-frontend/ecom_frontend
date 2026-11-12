import type { ReactNode } from "react"
import { FormToggle } from "./SettingsField"

/* ================================================================
   FormToggleCard — toggle + title + description + optional children.
   Children are shown only when `checked` is true.
   `variant="success"` gives the green "Active" treatment from the design.
   Used by: coupon max/min/active; future Marketing & Pages toggles.
   ================================================================ */

type FormToggleCardProps = {
  title: string
  description?: string
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
  children?: ReactNode
  variant?: "default" | "success"
  icon?: ReactNode
  className?: string
}

export function FormToggleCard({
  title,
  description,
  checked,
  onChange,
  disabled = false,
  children,
  variant = "default",
  icon,
  className,
}: FormToggleCardProps) {
  const containerClass =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50"
      : "border-(--border-light) bg-(--bg-surface-hover)"

  return (
    <div
      className={`rounded-md border ${containerClass} p-3 ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          {icon && (
            <span
              className={`mt-0.5 shrink-0 ${
                variant === "success"
                  ? "text-emerald-600"
                  : "text-(--text-muted)"
              }`}
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-(--text-primary)">
              {title}
            </p>
            {description && (
              <p className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
                {description}
              </p>
            )}
          </div>
        </div>
        <FormToggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          aria-label={title}
        />
      </div>
      {checked && children && (
        <div className="mt-3 border-t border-black/5 pt-3">{children}</div>
      )}
    </div>
  )
}
