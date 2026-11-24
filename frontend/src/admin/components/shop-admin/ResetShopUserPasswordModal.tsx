import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { KeyRound } from "lucide-react"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { FieldError } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { ApiError } from "../../api/client"
import { shopUsersApi, shopUserQueryKeys } from "../../api/shopUsersApi"
import type { ShopUser } from "./ShopUsersTable"

const resetSchema = z.object({
  password: z.string().min(12, "Password must be at least 12 characters"),
})
type ResetFormValues = z.infer<typeof resetSchema>

type Props = {
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
}: Props) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "" },
  })
  const mutation = useMutation({
    mutationFn: (values: ResetFormValues) => {
      if (!user) return Promise.reject(new Error("No user selected"))
      return shopUsersApi.resetPassword(user.id, values.password)
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: shopUserQueryKeys.all })
      setFormError(null)
      onSuccess(updated)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors?.password) {
        setError("password", {
          type: "server",
          message: error.fieldErrors.password,
        })
      } else {
        setFormError(
          error instanceof Error ? error.message : "Could not reset password"
        )
      }
    },
  })
  useEffect(() => {
    if (open) {
      reset({ password: "" })
      setFormError(null)
    }
  }, [open, reset])
  useEscapeKey(onClose, open && !mutation.isPending)
  if (!open || !user) return null

  return (
    <DialogShell
      title="Reset Password"
      subtitle={
        <p className="text-[11px] text-(--text-muted)">
          Set a new password for {user.name}
        </p>
      }
      icon={<KeyRound className="size-4" />}
      iconClassName="flex size-7 items-center justify-center rounded-md bg-(--status-pending-bg) text-(--status-pending-text)"
      panelClassName="w-full max-w-md rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl"
      closeDisabled={mutation.isPending}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit((values) => mutation.mutate(values))}>
        <div className="px-5 py-4">
          {formError && (
            <InlineNotice
              message={formError}
              variant="error"
              onDismiss={() => setFormError(null)}
              dismissLabel="Dismiss error"
              className="mb-3 flex items-center justify-between rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
            />
          )}
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
        </div>
        <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white disabled:opacity-50"
          >
            <KeyRound className="size-3.5" />
            {mutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
