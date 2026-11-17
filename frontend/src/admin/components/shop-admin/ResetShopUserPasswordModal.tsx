import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound, X } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { ShopUser } from "./ShopUsersTable"

const resetSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
})

type ResetFormValues = z.infer<typeof resetSchema>

type ResetShopUserPasswordModalProps = {
  open: boolean
  user: ShopUser | null
  onClose: () => void
  onSuccess: (user: ShopUser) => void
}

export function ResetShopUserPasswordModal({
  open,
  user,
  onClose,
  onSuccess,
}: ResetShopUserPasswordModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  })

  useEffect(() => {
    if (open) reset({ password: "" })
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !user) return null

  const onSubmit = async (_values: ResetFormValues) => {
    await new Promise((r) => setTimeout(r, 300))
    onSuccess(user)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--status-pending-bg) text-(--status-pending-text)">
              <KeyRound className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Reset Password
              </h2>
              <p className="text-[11px] text-(--text-muted)">
                Set a new password for {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              New Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="At least 12 characters"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
            <p className="mt-1 text-[11px] text-(--text-muted)">
              The user will need this password on their next login. Current
              session is not affected.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <KeyRound className="size-3.5" />
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
