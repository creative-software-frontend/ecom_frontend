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
  onDeactivate: () => Promise<void>
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return "Could not delete this product. Please try again."
}

function getErrorStatus(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status
  }
  return undefined
}

export function ConfirmDialog({
  open,
  productName,
  onCancel,
  onConfirm,
  onDeactivate,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [canDeactivate, setCanDeactivate] = useState(false)

  const handleCancel = () => {
    if (pending) return
    setErrorMessage(null)
    setCanDeactivate(false)
    onCancel()
  }

  const handleConfirm = async () => {
    setPending(true)
    setErrorMessage(null)
    setCanDeactivate(false)
    try {
      await onConfirm()
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
      setCanDeactivate(getErrorStatus(error) === 409)
    } finally {
      setPending(false)
    }
  }

  const handleDeactivate = async () => {
    setPending(true)
    setErrorMessage(null)
    setCanDeactivate(false)
    try {
      await onDeactivate()
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error))
      setCanDeactivate(getErrorStatus(error) === 409)
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
          {canDeactivate ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void handleDeactivate()}
              className="rounded"
            >
              Deactivate instead
            </Button>
          ) : null}
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
