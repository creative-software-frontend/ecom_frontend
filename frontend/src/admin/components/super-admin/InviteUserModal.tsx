import { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus, X } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { FormToggle } from "../settings/SettingsField"
import { useCreateAdminUserMutation } from "../../hooks/useAdminUsers"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { ApiError } from "../../api/client"
import type { SuperAdminRole, SuperAdminShop } from "../../types/superAdmin"
import { PasswordShowHide } from "../PasswordShowHide"

const bdPhoneRegex = /^01[3-9]\d{8}$/

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid BD mobile"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  roleId: z.number({ error: "Select a role" }).int().positive(),
  shopId: z.number().int().positive().nullable(),
  status: z.enum(["active", "inactive"]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

const EMPTY: InviteFormValues = {
  email: "",
  name: "",
  mobile: "",
  password: "",
  roleId: 0,
  shopId: null,
  status: "active",
}

type InviteUserModalProps = {
  open: boolean
  roles: SuperAdminRole[]
  shops: SuperAdminShop[]
  onClose: () => void
  onSuccess: (message: string) => void
}

export function InviteUserModal({
  open,
  roles,
  shops,
  onClose,
  onSuccess,
}: InviteUserModalProps) {
  const mutation = useCreateAdminUserMutation()
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  })
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)
  const selectedRoleId = useWatch({ name: "roleId", control })
  const shopId = useWatch({ control, name: "shopId" })
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId),
    [roles, selectedRoleId]
  )
  const requiresShop = selectedRole?.scope === "shop"
  const isPlatformRole = selectedRole?.scope === "platform"

  // Auto-clear shopId when switching to a platform role
  useEffect(() => {
    if (isPlatformRole && shopId !== null) {
      setValue("shopId", null, { shouldDirty: true })
    }
  }, [isPlatformRole, setValue, shopId])

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open) return null

  async function onSubmit(values: InviteFormValues) {
    try {
      await mutation.mutateAsync({
        email: values.email,
        name: values.name,
        mobile: values.mobile || undefined,
        password: values.password,
        roleId: values.roleId,
        shopId: values.shopId,
        status: values.status,
      })
      onSuccess(`User "${values.name}" created successfully.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        let mapped = false
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          const k = field as keyof InviteFormValues
          if (["email", "name", "mobile", "password"].includes(k)) {
            setError(k as "email" | "name" | "mobile" | "password", {
              type: "server",
              message: msg,
            })
            mapped = true
          }
        }
        if (!mapped) {
          setError("roleId", {
            type: "server",
            message: err.message || "Failed to create user",
          })
        }
      } else {
        setError("roleId", {
          type: "server",
          message: getErrorMessage(err, "Failed to create user"),
        })
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-user-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <UserPlus className="size-4" />
            </span>
            <h2
              id="invite-user-title"
              className="text-sm font-semibold text-(--text-primary)"
            >
              Add user
            </h2>
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
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="user@powerzenox.com"
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                  {...register("email")}
                />
                {errors.email && (
                  <FieldError>{errors.email.message}</FieldError>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                  {...register("name")}
                />
                {errors.name && <FieldError>{errors.name.message}</FieldError>}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Mobile{" "}
                <span className="text-xs font-normal text-(--text-muted)">
                  (optional)
                </span>
              </label>
              <input
                type="tel"
                placeholder="01XXXXXXXXX"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                {...register("mobile")}
              />
              {errors.mobile && (
                <FieldError>{errors.mobile.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 12 characters"
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
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
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-sm outline-none focus:border-primary"
                  {...register("roleId", { valueAsNumber: true })}
                >
                  <option value={0} disabled>
                    Select a role
                  </option>
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
                  Shop {requiresShop && <span className="text-red-500">*</span>}
                </label>
                <select
                  className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPlatformRole}
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
              </div>
            </div>

            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-(--text-primary)">
                      Active account
                    </p>
                    <p className="text-xs text-(--text-muted)">
                      If off, user cannot log in until activated
                    </p>
                  </div>
                  <FormToggle
                    checked={field.value === "active"}
                    onChange={(v) => field.onChange(v ? "active" : "inactive")}
                    aria-label="Active account"
                  />
                </div>
              )}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
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
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <UserPlus className="size-3.5" />
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
