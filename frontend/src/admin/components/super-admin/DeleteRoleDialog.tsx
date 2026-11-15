import { Trash2 } from "lucide-react"
import { ConfirmationDialog } from "../common/ConfirmationDialog"

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
  return (
    <ConfirmationDialog
      open={open}
      title="Delete role?"
      variant="danger"
      icon={Trash2}
      confirmLabel={isPending ? "Deleting..." : "Delete role"}
      isPending={isPending}
      disabled={userCount > 0}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
      description={
        <>
          Delete the role <strong>{roleName}</strong>? This action cannot be
          undone.
        </>
      }
      notice={
        userCount > 0 ? (
          <div className="rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-xs text-(--status-pending-text)">
            {userCount} user{userCount === 1 ? "" : "s"} currently have this
            role. Reassign them to another role before deleting.
          </div>
        ) : null
      }
    />
  )
}
