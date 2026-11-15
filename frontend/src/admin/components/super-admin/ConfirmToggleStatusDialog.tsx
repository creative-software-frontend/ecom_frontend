import { Power, PowerOff } from "lucide-react"
import { ConfirmationDialog } from "../common/ConfirmationDialog"

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
  const isDeactivate = nextStatus === "inactive"

  return (
    <ConfirmationDialog
      open={open}
      title={isDeactivate ? "Deactivate user?" : "Activate user?"}
      variant={isDeactivate ? "danger" : "success"}
      icon={isDeactivate ? PowerOff : Power}
      confirmLabel={isDeactivate ? "Deactivate" : "Activate"}
      isPending={isPending}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
      description={
        isDeactivate ? (
          <>
            <strong>{userName}</strong> will be signed out immediately and
            cannot log in until reactivated.
          </>
        ) : (
          <>
            <strong>{userName}</strong> will regain access to the platform with
            their existing role and permissions.
          </>
        )
      }
    />
  )
}
