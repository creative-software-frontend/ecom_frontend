import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { UserPlus } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { ShopUser } from "./ShopUsersTable"

// Shop admin CANNOT create shop_admin — only staff roles.
const SHOP_STAFF_ROLES = [
  { value: "salesman", label: "Salesman" },
  { value: "order_handler", label: "Order Handler" },
  { value: "product_uploader", label: "Product Uploader" },
]

const bdPhoneRegex = /^01[3-9]\d{8}$/

const inviteSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  mobile: z
    .string()
    .trim()
    .refine((v) => !v || bdPhoneRegex.test(v), "Enter a valid BD mobile"),
  password: z.string().min(12, "Password must be at least 12 characters"),
  role: z.string().min(1, "Select a role"),
  status: z.enum(["active", "inactive"]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

const EMPTY: InviteFormValues = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  role: "",
  status: "active",
}

type InviteShopUserModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (user: ShopUser) => void
}

export function InviteShopUserModal({
  open,
  onClose,
  onSuccess,
}: InviteShopUserModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open) return null

  const onSubmit = async (values: InviteFormValues) => {
    // Mock — backend later. Simulate network.
    await new Promise((r) => setTimeout(r, 300))
    const role = SHOP_STAFF_ROLES.find((r) => r.value === values.role)
    onSuccess({
      id: Date.now(), // temporary local id
      name: values.name,
      email: values.email,
      mobile: values.mobile || "",
      role: values.role,
      roleDisplayName: role?.label ?? values.role,
      status: values.status,
      lastLoginAt: "Never",
    })
    onClose()
  }

  const statusValue = watch("status")

  return (
    <DialogShell
      title="Add User"
      icon={<UserPlus className="size-4" />}
      closeButtonClassName="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
      closeDisabled={isSubmitting}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name"
                className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                {...register("name")}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="user@shop.com"
                className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                {...register("email")}
              />
              {errors.email && <FieldError>{errors.email.message}</FieldError>}
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
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("mobile")}
            />
            {errors.mobile && <FieldError>{errors.mobile.message}</FieldError>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Password <span className="text-red-500">*</span>
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
              Role <span className="text-red-500">*</span>
            </label>
            <select
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("role")}
            >
              <option value="">Select a role</option>
              {SHOP_STAFF_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.role && <FieldError>{errors.role.message}</FieldError>}
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
              onChange={(v) => setValue("status", v ? "active" : "inactive")}
            />
          </div>
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
            <UserPlus className="size-3.5" />
            {isSubmitting ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
