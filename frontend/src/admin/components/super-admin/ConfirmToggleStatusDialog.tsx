import { AlertCircle, Power, PowerOff, X } from "lucide-react"

type ConfirmToggleStatusDialogProps = {
  open: boolean
  userName: string
  nextStatus: "active" | "inactive"
  isPending: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmToggleStatusDialog({
  open,
  userName,
  nextStatus,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmToggleStatusDialogProps) {
  if (!open) return null

  const isDeactivate = nextStatus === "inactive"
  const Icon = isDeactivate ? PowerOff : Power

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="toggle-status-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-8 items-center justify-center rounded-md ${
                isDeactivate
                  ? "bg-(--status-cancelled-bg) text-(--status-cancelled-text)"
                  : "bg-(--status-delivered-bg) text-(--status-delivered-text)"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <h2
              id="toggle-status-title"
              className="text-sm font-semibold text-(--text-primary)"
            >
              {isDeactivate ? "Deactivate user?" : "Activate user?"}
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

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm leading-relaxed text-(--text-primary)">
            {isDeactivate ? (
              <>
                <strong>{userName}</strong> will be signed out immediately and
                cannot log in until reactivated.
              </>
            ) : (
              <>
                <strong>{userName}</strong> will regain access to the platform
                with their existing role and permissions.
              </>
            )}
          </p>

          {errorMessage && (
            <div className="flex items-start gap-2 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 p-2.5 text-xs text-(--status-cancelled-text)">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex h-8 items-center rounded-md px-3 text-[13px] font-medium text-white transition-colors disabled:opacity-50 ${
              isDeactivate
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary hover:bg-(--primary-hover)"
            }`}
          >
            {isPending
              ? "Updating..."
              : isDeactivate
                ? "Deactivate"
                : "Activate"}
          </button>
        </div>
      </div>
    </div>
  )
}
