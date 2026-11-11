import { AlertCircle, Trash2, X } from "lucide-react"

type DeleteRoleDialogProps = {
  open: boolean
  roleName: string
  userCount: number
  isPending: boolean
  errorMessage: string | null
  onCancel: () => void
  onConfirm: () => void
}

export function DeleteRoleDialog({
  open,
  roleName,
  userCount,
  isPending,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteRoleDialogProps) {
  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-role-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-(--status-cancelled-bg) text-(--status-cancelled-text)">
              <Trash2 className="size-4" />
            </span>
            <h2
              id="delete-role-title"
              className="text-sm font-semibold text-(--text-primary)"
            >
              Delete role?
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
            Delete the role <strong>{roleName}</strong>? This action cannot be
            undone.
          </p>

          {userCount > 0 && (
            <div className="rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              {userCount} user{userCount === 1 ? "" : "s"} currently have this
              role. Reassign them to another role before deleting.
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
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending || userCount > 0}
            className="inline-flex h-8 items-center rounded-md bg-red-600 px-3 text-[13px] font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Deleting..." : "Delete role"}
          </button>
        </div>
      </div>
    </div>
  )
}
