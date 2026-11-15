import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { AlertCircle, X } from "lucide-react"
import { useEscapeKey } from "../../hooks/useEscapeKey"

export type ConfirmationDialogVariant = "danger" | "success" | "warning" | "primary"

export type ConfirmationDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmationDialogVariant
  icon?: LucideIcon
  isPending?: boolean
  disabled?: boolean
  errorMessage?: string | null
  notice?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

const variantStyles: Record<
  ConfirmationDialogVariant,
  {
    iconBox: string
    confirmBtn: string
  }
> = {
  danger: {
    iconBox: "bg-(--status-cancelled-bg) text-(--status-cancelled-text)",
    confirmBtn: "bg-red-600 text-white hover:bg-red-700",
  },
  success: {
    iconBox: "bg-(--status-delivered-bg) text-(--status-delivered-text)",
    confirmBtn: "bg-(--primary) text-white hover:bg-(--primary-hover)",
  },
  warning: {
    iconBox: "bg-(--status-pending-bg) text-(--status-pending-text)",
    confirmBtn: "bg-amber-600 text-white hover:bg-amber-700",
  },
  primary: {
    iconBox: "bg-(--primary-soft) text-primary",
    confirmBtn: "bg-primary text-white hover:bg-(--primary-hover)",
  },
}

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  icon: Icon,
  isPending = false,
  disabled = false,
  errorMessage,
  notice,
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  useEscapeKey(onCancel, open && !isPending)

  if (!open) return null

  const styles = variantStyles[variant]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
          <div className="flex items-center gap-2">
            {Icon && (
              <span
                className={`flex size-8 items-center justify-center rounded-md ${styles.iconBox}`}
              >
                <Icon className="size-4" />
              </span>
            )}
            <h2
              id="confirmation-dialog-title"
              className="text-sm font-semibold text-(--text-primary)"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-3 px-5 py-4">
          <div className="text-sm leading-relaxed text-(--text-primary)">
            {description}
          </div>

          {notice && <div>{notice}</div>}

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 p-2.5 text-xs text-(--status-cancelled-text)">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || disabled}
            className={`inline-flex h-8 items-center rounded-md px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isPending ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
