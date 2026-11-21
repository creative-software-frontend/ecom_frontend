import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { Save, UserCog, Lock } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { ShopUser } from "./ShopUsersTable"

const SHOP_STAFF_ROLES = [
  { value: "salesman", label: "Salesman" },
  { value: "order_handler", label: "Order Handler" },
  { value: "product_uploader", label: "Product Uploader" },
]

const bdPhoneRegex = /^01[3-9]\d{8}$/

const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid BD mobile"),
  role: z.string(),
  status: z.enum(["active", "inactive"]),
})

type EditFormValues = z.infer<typeof editSchema>

type EditShopUserDrawerProps = {
  open: boolean
  user: ShopUser | null
  currentUserId: number
  onClose: () => void
  onSuccess: (updated: ShopUser) => void
}

export function EditShopUserDrawer({
  open,
  user,
  currentUserId,
  onClose,
  onSuccess,
}: EditShopUserDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
  })

  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
      })
    }
  }, [open, user, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !user) return null

  const isSelf = user.id === currentUserId
  // Shop admin role and self editing cannot change role/status
  const roleLocked = isSelf || user.role === "shop_admin"
  const statusLocked = isSelf || user.role === "shop_admin"

  const onSubmit = async (values: EditFormValues) => {
    if (!user) return
    await new Promise((r) => setTimeout(r, 300))
    const role = SHOP_STAFF_ROLES.find((r) => r.value === values.role)
    onSuccess({
      ...user,
      name: values.name,
      mobile: values.mobile,
      role: values.role,
      roleDisplayName:
        user.role === "shop_admin"
          ? user.roleDisplayName
          : (role?.label ?? values.role),
      status: values.status,
    })
    onClose()
  }

  const statusValue = watch("status")

  return (
    <DialogShell
      title="Edit User"
      placement="drawer"
      subtitle={<p className="text-[11px] text-(--text-muted)">{user.email}</p>}
      icon={<UserCog className="size-4" />}
      closeDisabled={isSubmitting}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {(isSelf || user.role === "shop_admin") && (
            <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              <Lock className="mt-0.5 size-3.5 shrink-0" />
              <span>
                {isSelf
                  ? "You cannot change your own role or account status."
                  : "Shop admin role and status are locked — contact the platform admin to change."}
              </span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
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
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary) disabled:cursor-not-allowed disabled:opacity-50"
              {...register("role")}
            >
              {user.role === "shop_admin" ? (
                <option value="shop_admin">Shop Admin</option>
              ) : (
                SHOP_STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))
              )}
            </select>
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
              onChange={(v) => setValue("status", v ? "active" : "inactive")}
              disabled={statusLocked}
            />
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
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
            <Save className="size-3.5" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
