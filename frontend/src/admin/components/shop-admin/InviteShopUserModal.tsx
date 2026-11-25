import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { UserPlus } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { ApiError } from "../../api/client"
import {
  shopUsersApi,
  shopUserQueryKeys,
  type ShopAssignableRole,
} from "../../api/shopUsersApi"
import type { ShopUser } from "./ShopUsersTable"

const bdPhoneRegex = /^01[3-9]\d{8}$/
const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  mobile: z
    .string()
    .trim()
    .refine(
      (value) => !value || bdPhoneRegex.test(value),
      "Enter a valid BD mobile"
    ),
  password: z.string().min(12, "Password must be at least 12 characters"),
  roleId: z.number().int().positive("Select a role"),
  status: z.enum(["active", "inactive"]),
})
type InviteFormValues = z.infer<typeof inviteSchema>

const EMPTY: InviteFormValues = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  roleId: 0,
  status: "active",
}

type Props = {
  open: boolean
  onClose: () => void
  onSuccess: (user: ShopUser) => void
  roles: ShopAssignableRole[]
}

export function InviteShopUserModal({
  open,
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
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  })

  const mutation = useMutation({
    mutationFn: (values: InviteFormValues) =>
      shopUsersApi.create({
        name: values.name,
        email: values.email,
        mobile: values.mobile || null,
        password: values.password,
        roleId: values.roleId,
        status: values.status,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: shopUserQueryKeys.all })
      setFormError(null)
      onSuccess(created)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        let mapped = false
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in EMPTY) {
            setError(field as keyof InviteFormValues, {
              type: "server",
              message,
            })
            mapped = true
          }
        }
        setFormError(mapped ? null : error.message)
        return
      }
      setFormError(
        error instanceof Error ? error.message : "Could not create user"
      )
    },
  })

  useEffect(() => {
    if (open) {
      reset(EMPTY)
      setFormError(null)
    }
  }, [open, reset])
  useEscapeKey(onClose, open && !mutation.isPending)
  if (!open) return null

  const statusValue = watch("status")
  return (
    <DialogShell
      title="Add User"
      icon={<UserPlus className="size-4" />}
      closeButtonClassName="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
      closeDisabled={mutation.isPending}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit((values) => mutation.mutate(values))}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {formError && (
            <InlineNotice
              message={formError}
              variant="error"
              onDismiss={() => setFormError(null)}
              dismissLabel="Dismiss error"
              className="flex items-center justify-between rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
            />
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                Email *
              </label>
              <input
                type="email"
                className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Mobile (optional)
            </label>
            <input
              type="tel"
              placeholder="01XXXXXXXXX"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("mobile")}
            />
            {errors.mobile && <FieldError>{errors.mobile.message}</FieldError>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Password *
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
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Role *
            </label>
            <select
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("roleId", { valueAsNumber: true })}
            >
              <option value={0}>Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.displayName}
                </option>
              ))}
            </select>
            {errors.roleId && <FieldError>{errors.roleId.message}</FieldError>}
          </div>
          <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-(--text-primary)">
                Active account
              </p>
              <p className="text-[10px] text-(--text-muted)">
                If off, user cannot log in until activated
              </p>
            </div>
            <FormToggle
              checked={statusValue === "active"}
              onChange={(value) =>
                setValue("status", value ? "active" : "inactive")
              }
            />
          </div>
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
            <UserPlus className="size-3.5" />
            {mutation.isPending ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
