import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound, X } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { useResetAdminUserPasswordMutation } from "../../hooks/useAdminUsers"
import { ApiError } from "../../api/client"
import type { SuperAdminUser } from "../../types/superAdmin"
import { PasswordShowHide } from "../PasswordShowHide"

const resetPasswordSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

type ResetPasswordModalProps = {
  open: boolean
  user: SuperAdminUser | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function ResetPasswordModal({
  open,
  user,
  onClose,
  onSuccess,
}: ResetPasswordModalProps) {
  const mutation = useResetAdminUserPasswordMutation()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "" },
  })
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)

  // Reset form state each time modal opens (or target user changes).
  useEffect(() => {
    if (open) reset({ password: "" })
  }, [open, user?.id, reset])

  // Escape closes
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose()
    }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open, isSubmitting, onClose])

  if (!open || !user) return null

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      await mutation.mutateAsync({ id: user!.id, password: values.password })
      onSuccess(`Password updated for ${user!.name}.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors?.password) {
        setError("password", {
          type: "server",
          message: err.fieldErrors.password,
        })
      } else {
        setError("password", {
          type: "server",
          message:
            err instanceof ApiError ? err.message : "Failed to reset password",
        })
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pw-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-md bg-(--status-pending-bg) text-(--status-pending-text)">
              <KeyRound className="size-4" />
            </span>
            <div>
              <h2
                id="reset-pw-title"
                className="text-sm font-semibold text-(--text-primary)"
              >
                Reset password
              </h2>
              <p className="text-xs text-(--text-muted)">
                Set a new password for {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-5 py-4">
            <label
              htmlFor="reset-pw-input"
              className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
            >
              New password
            </label>
            <div className="relative">
              <input
                id="reset-pw-input"
                type={passwordVisible ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 12 characters"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                aria-invalid={Boolean(errors.password)}
                {...register("password")}
              />
              <PasswordShowHide
                passwordVisible={passwordVisible}
                setPasswordVisible={setPasswordVisible}
              />
            </div>

            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
            <p className="mt-1 text-xs text-(--text-muted)">
              User will need this password on their next login. They will not be
              logged out of the current session.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              {isSubmitting ? (
                "Updating..."
              ) : (
                <>
                  <KeyRound className="size-3.5" />
                  Update password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
