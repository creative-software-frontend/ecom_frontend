import { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, AlertCircle, UserCog } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { FormToggle } from "../settings/SettingsField"
import { useUpdateAdminUserMutation } from "../../hooks/useAdminUsers"
import { ApiError } from "../../api/client"
import type {
  SuperAdminRole,
  SuperAdminShop,
  SuperAdminUser,
} from "../../types/superAdmin"

const bdPhoneRegex = /^01[3-9]\d{8}$/
const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid BD mobile"),
  roleId: z.number().int().positive(),
  shopId: z.number().int().positive().nullable(),
  status: z.enum(["active", "inactive"]),
})
type EditFormValues = z.infer<typeof editSchema>

type EditUserDrawerProps = {
  open: boolean
  user: SuperAdminUser | null
  roles: SuperAdminRole[]
  shops: SuperAdminShop[]
  currentUserId: number
  onClose: () => void
  onSuccess: (message: string) => void
}

export function EditUserDrawer({
  open,
  user,
  roles,
  shops,
  currentUserId,
  onClose,
  onSuccess,
}: EditUserDrawerProps) {
  const updateMutation = useUpdateAdminUserMutation()
  const [drawerError, setDrawerError] = useState<string | null>(null)

  const isSelf = user?.id === currentUserId
  const isSuperAdminRole = user?.role === "super_admin"
  const isLastSuperAdmin = isSuperAdminRole && user?.status === "active"

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  // Populate when user changes
  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        mobile: user.mobile,
        roleId: user.roleId,
        shopId: user.shopId,
        status: user.status,
      })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDrawerError(null)
    }
  }, [open, user, reset])

  const selectedRoleId = useWatch({ name: "roleId", control })
  const shopId = useWatch({ control, name: "shopId" })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )
  const requiresShop = selectedRole?.scope === "shop"
  const isPlatformRole = selectedRole?.scope === "platform"

  // Auto-clear shop on platform role
  useEffect(() => {
    if (isPlatformRole && shopId !== null) {
      setValue("shopId", null, { shouldDirty: true })
    }
  }, [isPlatformRole, setValue, shopId])

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

  async function onSubmit(values: EditFormValues) {
    if (!user) return
    try {
      await updateMutation.mutateAsync({
        id: user.id,
        data: {
          name: values.name,
          mobile: values.mobile,
          roleId: values.roleId,
          shopId: values.shopId,
          status: values.status,
        },
      })
      onSuccess(`User "${values.name}" updated.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        let mapped = false
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          if (["name", "mobile"].includes(field)) {
            setError(field as "name" | "mobile", {
              type: "server",
              message: msg,
            })
            mapped = true
          }
        }
        if (!mapped) setDrawerError(err.message)
      } else {
        setDrawerError(
          err instanceof ApiError ? err.message : "Failed to update user"
        )
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <UserCog className="size-4" />
            </span>
            <div>
              <h2
                id="edit-user-title"
                className="text-sm font-semibold text-(--text-primary)"
              >
                Edit user
              </h2>
              <p className="text-xs text-(--text-muted)">{user.email}</p>
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

            {isSelf && (
              <div className="rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-xs text-(--status-pending-text)">
                You are editing your own account. Role and status changes are
                disabled.
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Name
              </label>
              <input
                type="text"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
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
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                {...register("mobile")}
              />
              {errors.mobile && (
                <FieldError>{errors.mobile.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Role
              </label>
              <select
                disabled={isSelf}
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                {...register("roleId", { valueAsNumber: true })}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.displayName} ({r.scope})
                  </option>
                ))}
              </select>
              {errors.roleId && (
                <FieldError>{errors.roleId.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Shop
              </label>
              <select
                disabled={isPlatformRole || isSelf}
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                {...register("shopId", {
                  setValueAs: (v) =>
                    v === "" || v === null ? null : Number(v),
                })}
              >
                <option value="">
                  {isPlatformRole ? "Not applicable" : "Select a shop"}
                </option>
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.shopId && (
                <FieldError>{errors.shopId.message}</FieldError>
              )}
              {requiresShop && !shopId && (
                <p className="mt-1 text-xs text-red-600">
                  This role requires a shop.
                </p>
              )}
            </div>

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-(--text-primary)">
                      Account status
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      {field.value === "active"
                        ? "User can log in"
                        : "User is blocked from logging in"}
                    </p>
                  </div>
                  <FormToggle
                    checked={field.value === "active"}
                    onChange={(v) => field.onChange(v ? "active" : "inactive")}
                    disabled={isSelf || isLastSuperAdmin}
                    aria-label="Account status"
                  />
                </div>
              )}
            />

            {isLastSuperAdmin && (
              <p className="text-xs text-(--status-pending-text)">
                ⚠️ This is the only active super admin. Deactivating will be
                blocked by the server.
              </p>
            )}
          </div>

          <div className="flex justify-between gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <Save className="size-3.5" />
              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
