import { AlertCircle, Power, PowerOff, X, Store } from "lucide-react"

type ConfirmToggleShopDialogProps = {
  open: boolean
  shopName: string
  currentStatus: "active" | "trial" | "inactive"
  nextStatus: "active" | "inactive"
  isPending: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmToggleShopDialog({
  open,
  shopName,
  currentStatus,
  nextStatus,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmToggleShopDialogProps) {
  if (!open) return null

  const isSuspend = nextStatus === "inactive"
  const Icon = isSuspend ? PowerOff : Power

  // Heads-up for trial → active promotion
  const isPromotion = currentStatus === "trial" && nextStatus === "active"

  return (
    <div
      role="dialog"
      aria-modal="true"
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
                isSuspend
                  ? "bg-(--status-cancelled-bg) text-(--status-cancelled-text)"
                  : "bg-(--status-delivered-bg) text-(--status-delivered-text)"
              }`}
            >
              <Icon className="size-4" />
            </span>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              {isSuspend
                ? "Suspend shop?"
                : isPromotion
                  ? "Activate from trial?"
                  : "Activate shop?"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <p className="text-sm leading-relaxed text-(--text-primary)">
            {isSuspend ? (
              <>
                <strong>{shopName}</strong> will be suspended. All staff under
                this shop will be immediately logged out and blocked from
                signing in until the shop is reactivated.
              </>
            ) : isPromotion ? (
              <>
                <strong>{shopName}</strong> will be promoted from Trial to a
                full Active subscription. Staff will keep their current access.
              </>
            ) : (
              <>
                <strong>{shopName}</strong> will be reactivated and all staff
                will regain access with their existing roles and permissions.
              </>
            )}
          </p>

          {isSuspend && (
            <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              <Store className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This is reversible. You can reactivate the shop anytime from
                this page.
              </span>
            </div>
          )}

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
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
              isSuspend
                ? "bg-red-600 hover:bg-red-700"
                : "bg-(--primary) hover:bg-(--primary-hover)"
            }`}
          >
            {isPending ? "Updating..." : isSuspend ? "Suspend" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  )
}
