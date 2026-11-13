import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Shield, Store, X, Save, AlertCircle, Lock } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { PermissionMatrix } from "./PermissionMatrix"
import { useUpdateRoleMutation } from "../../hooks/useAdminUsers"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { ApiError } from "../../api/client"
import type { SuperAdminRole } from "../../types/superAdmin"

const editSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required")
    .max(80)
    .regex(
      /^[\x20-\x7E]+$/,
      "Use English letters and standard ASCII characters only"
    ),
  description: z.string().trim().max(500),
  permissions: z.record(z.string(), z.array(z.string())),
})
type EditFormValues = z.infer<typeof editSchema>

type EditRoleDrawerProps = {
  open: boolean
  role: SuperAdminRole | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function EditRoleDrawer({
  open,
  role,
  onClose,
  onSuccess,
}: EditRoleDrawerProps) {
  const mutation = useUpdateRoleMutation()
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const isSuperAdminRole = role?.name === "super_admin"

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      displayName: "",
      description: "",
      permissions: {},
    },
  })
  useEffect(() => {
    if (open && role) {
      reset({
        displayName: role.displayName,
        description: role.description,
        permissions: role.permissions ?? {},
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDrawerError(null)
    }
  }, [open, role, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !role) return null

  async function onSubmit(values: EditFormValues) {
    if (!role) return
    try {
      await mutation.mutateAsync({
        id: role.id,
        data: {
          displayName: values.displayName,
          description: values.description,
          ...(isSuperAdminRole ? {} : { permissions: values.permissions }),
        },
      })
      onSuccess(`Role "${values.displayName}" updated.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          if (field === "displayName") {
            setError("displayName", { type: "server", message: msg })
          }
        }
        setDrawerError(err.message)
      } else {
        setDrawerError(getErrorMessage(err, "Failed to update role"))
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-role-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col border-l border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              {role.scope === "platform" ? (
                <Shield className="size-4" />
              ) : (
                <Store className="size-4" />
              )}
            </span>
            <div>
              <h2
                id="edit-role-title"
                className="text-sm font-semibold text-(--text-primary)"
              >
                {isSuperAdminRole ? "View role" : "Edit role"}
              </h2>
              <p className="font-mono text-xs text-(--text-muted)">
                {role.name} · {role.scope}
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

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {drawerError && (
              <div className="flex items-start gap-2 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 p-2.5 text-xs text-(--status-cancelled-text)">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{drawerError}</span>
              </div>
            )}

            {isSuperAdminRole && (
              <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-xs text-(--status-pending-text)">
                <Lock className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  The super admin role has unrestricted access to everything.
                  Permissions cannot be modified.
                </span>
              </div>
            )}

            {role.isSystem && !isSuperAdminRole && (
              <div className="flex items-start gap-2 rounded-md border border-(--status-confirmed-bg) bg-(--status-confirmed-bg)/50 p-2.5 text-xs text-(--status-confirmed-text)">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>
                  This is a system role. Changes to permissions will affect all
                  users with this role.
                </span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Display name
              </label>
              <input
                type="text"
                disabled={isSuperAdminRole}
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("displayName")}
              />
              {errors.displayName && (
                <FieldError>{errors.displayName.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Description
              </label>
              <textarea
                rows={2}
                disabled={isSuperAdminRole}
                className="block w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20 disabled:cursor-not-allowed disabled:opacity-50"
                {...register("description")}
              />
            </div>

            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <PermissionMatrix
                  value={field.value ?? {}}
                  onChange={field.onChange}
                  scope={role.scope}
                  disabled={isSuperAdminRole}
                />
              )}
            />
          </div>

          <div className="flex justify-between gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              {isSuperAdminRole ? "Close" : "Cancel"}
            </button>
            {!isSuperAdminRole && (
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
              >
                <Save className="size-3.5" />
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
