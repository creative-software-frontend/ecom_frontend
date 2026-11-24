import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Lock, Save, UserCog } from "lucide-react"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { ApiError } from "../../api/client"
import {
  shopUsersApi,
  shopUserQueryKeys,
  type ShopAssignableRole,
} from "../../api/shopUsersApi"
import type { ShopUser } from "./ShopUsersTable"

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: z
    .string()
    .trim()
    .refine(
      (value) => !value || /^01[3-9]\d{8}$/.test(value),
      "Enter a valid BD mobile"
    ),
  roleId: z.number().int().positive("Select a role"),
  status: z.enum(["active", "inactive"]),
})
type EditFormValues = z.infer<typeof editSchema>

type Props = {
  open: boolean
  user: ShopUser | null
  currentUserId: number
  onClose: () => void
  onSuccess: (updated: ShopUser) => void
  roles: ShopAssignableRole[]
}

export function EditShopUserDrawer({
  open,
  user,
  currentUserId,
  onClose,
  onSuccess,
  roles,
}: Props) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<EditFormValues>({ resolver: zodResolver(editSchema) })

  const roleLocked =
    !!user && (user.id === currentUserId || user.role === "shop_admin")
  const statusLocked = roleLocked
  const mutation = useMutation({
    mutationFn: (values: EditFormValues) => {
      if (!user) return Promise.reject(new Error("No user selected"))
      return shopUsersApi.update(user.id, {
        name: values.name,
        mobile: values.mobile || null,
        ...(!roleLocked ? { roleId: values.roleId } : {}),
        ...(!statusLocked ? { status: values.status } : {}),
      })
    },
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: shopUserQueryKeys.all })
      setFormError(null)
      onSuccess(updated)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        let mapped = false
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (
            field === "name" ||
            field === "mobile" ||
            field === "roleId" ||
            field === "status"
          ) {
            setError(field as keyof EditFormValues, { type: "server", message })
            mapped = true
          }
        }
        setFormError(mapped ? null : error.message)
        return
      }
      setFormError(
        error instanceof Error ? error.message : "Could not update user"
      )
    },
  })

  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        mobile: user.mobile,
        roleId: user.roleId,
        status: user.status,
      })
      setFormError(null)
    }
  }, [open, user, reset])
  useEscapeKey(onClose, open && !mutation.isPending)
  if (!open || !user) return null

  const statusValue = watch("status")
  return (
    <DialogShell
      title="Edit User"
      placement="drawer"
      subtitle={<p className="text-[11px] text-(--text-muted)">{user.email}</p>}
      icon={<UserCog className="size-4" />}
      closeDisabled={mutation.isPending}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {formError && (
            <InlineNotice
              message={formError}
              variant="error"
              onDismiss={() => setFormError(null)}
              dismissLabel="Dismiss error"
              className="flex items-center justify-between rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
            />
          )}
          {roleLocked && (
            <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {user.id === currentUserId
                  ? "You cannot change your own role or account status."
                  : "Shop admin role and status are locked."}
              </span>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Name *
            </label>
            <input
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Mobile
            </label>
            <input
              type="tel"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("mobile")}
            />
            {errors.mobile && <FieldError>{errors.mobile.message}</FieldError>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Role
            </label>
            <select
              disabled={roleLocked}
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary) disabled:opacity-50"
              {...register("roleId", { valueAsNumber: true })}
            >
              {user.role === "shop_admin" ? (
                <option value={user.roleId}>{user.roleDisplayName}</option>
              ) : (
                roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.displayName}
                  </option>
                ))
              )}
            </select>
            {errors.roleId && <FieldError>{errors.roleId.message}</FieldError>}
          </div>
          <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-(--text-primary)">
                Account Status
              </p>
              <p className="text-[10px] text-(--text-muted)">
                {statusValue === "active"
                  ? "User can log in"
                  : "User is blocked"}
              </p>
            </div>
            <FormToggle
              checked={statusValue === "active"}
              onChange={(value) =>
                setValue("status", value ? "active" : "inactive")
              }
              disabled={statusLocked}
            />
          </div>
        </div>
        <div className="flex justify-between gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
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
            <Save className="size-3.5" />
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
