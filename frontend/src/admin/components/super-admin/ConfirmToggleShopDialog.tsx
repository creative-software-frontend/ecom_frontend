import { Power, PowerOff, Store } from "lucide-react"
import { ConfirmationDialog } from "../common/ConfirmationDialog"

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
  const isSuspend = nextStatus === "inactive"
  const isPromotion = currentStatus === "trial" && nextStatus === "active"

  return (
    <ConfirmationDialog
      open={open}
      title={
        isSuspend
          ? "Suspend shop?"
          : isPromotion
            ? "Activate from trial?"
            : "Activate shop?"
      }
      variant={isSuspend ? "danger" : "success"}
      icon={isSuspend ? PowerOff : Power}
      confirmLabel={
        isSuspend
          ? "Suspend shop"
          : isPromotion
            ? "Activate shop"
            : "Activate shop"
      }
      isPending={isPending}
      errorMessage={errorMessage}
      onCancel={onCancel}
      onConfirm={onConfirm}
      description={
        isSuspend ? (
          <>
            <strong>{shopName}</strong> will be suspended. All staff under this
            shop will be immediately logged out and blocked from signing in
            until the shop is reactivated.
          </>
        ) : isPromotion ? (
          <>
            <strong>{shopName}</strong> will be promoted from Trial to a full
            Active subscription. Staff will keep their current access.
          </>
        ) : (
          <>
            <strong>{shopName}</strong> will be reactivated and all staff will
            regain access with their existing roles and permissions.
          </>
        )
      }
      notice={
        isSuspend ? (
          <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-xs text-(--status-pending-text)">
            <Store className="mt-0.5 size-3.5 shrink-0" />
            <span>
              This is reversible. You can reactivate the shop anytime from this
              page.
            </span>
          </div>
        ) : null
      }
    />
  )
}
