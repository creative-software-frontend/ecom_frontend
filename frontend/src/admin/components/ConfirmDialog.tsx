import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleCancel = () => {
    if (pending) return
    setErrorMessage(null)
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
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) {
          handleCancel()
        }
      }}
    >
      <DialogContent className="max-w-md rounded" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete product?</DialogTitle>
          <DialogDescription>
            Delete{" "}
            <strong className="font-semibold text-foreground">
              {productName}
            </strong>
            ? This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {errorMessage ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={handleCancel}
            className="rounded"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() => void handleConfirm()}
            className="rounded"
          >
            {pending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ConfirmDialog
