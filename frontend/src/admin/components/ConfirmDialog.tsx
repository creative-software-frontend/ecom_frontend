import { useEffect, useRef, useState } from "react"

type ConfirmDialogProps = {
  open: boolean
  productName: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    error.status === 409
  ) {
    return "This product has orders and cannot be deleted."
  }
  if (error instanceof Error) {
    return error.message
  }
  return "Could not delete this product. Please try again."
}

export function ConfirmDialog({
  open,
  productName,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      setErrorMessage(null)
      dialog.showModal()
      cancelButtonRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const handleCancel = () => {
    if (pending) return
    onCancel()
  }

  const handleConfirm = async () => {
    setPending(true)
    setErrorMessage(null)
    try {
      await onConfirm()
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setPending(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="admin-confirm-dialog"
      aria-labelledby="admin-confirm-dialog-title"
      aria-describedby="admin-confirm-dialog-description"
      onCancel={(event) => {
        event.preventDefault()
        handleCancel()
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault()
          handleCancel()
        }
      }}
      onClose={onCancel}
    >
      <div className="admin-confirm-dialog-header">
        <h2 id="admin-confirm-dialog-title">Delete product?</h2>
      </div>
      <div className="admin-confirm-dialog-body">
        <p id="admin-confirm-dialog-description">
          Delete <strong>{productName}</strong>? This action is permanent and
          cannot be undone.
        </p>
        {errorMessage ? (
          <p className="admin-confirm-dialog-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="admin-confirm-dialog-footer">
        <button
          ref={cancelButtonRef}
          type="button"
          className="admin-template-button admin-template-button--secondary"
          disabled={pending}
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          type="button"
          className="admin-template-button admin-template-button--danger"
          disabled={pending}
          onClick={() => void handleConfirm()}
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
