import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Store } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { useCreateShopMutation } from "../../hooks/useAdminUsers"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { ApiError } from "../../api/client"

// Zod Schema (ব্যাকএন্ডের সাথে ম্যাচ করা)
const createShopSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required").max(150),
  mobile: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^01[3-9]\d{8}$/.test(v),
      "Enter a valid BD mobile number"
    )
    .optional(),
  address: z.string().trim().max(500).optional(),
  status: z.enum(["active", "trial", "inactive"]).default("active"),
})

type CreateShopFormValues = z.input<typeof createShopSchema>
// type CreateShopSubmitValues = z.output<typeof createShopSchema>

type CreateShopModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function CreateShopModal({
  open,
  onClose,
  onSuccess,
}: CreateShopModalProps) {
  const mutation = useCreateShopMutation()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateShopFormValues>({
    resolver: zodResolver(createShopSchema),
    defaultValues: {
      name: "",
      mobile: "",
      address: "",
      status: "active",
    },
  })

  useEffect(() => {
    if (open) reset()
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open) return null

  async function onSubmit(values: CreateShopFormValues) {
    try {
      await mutation.mutateAsync({
        name: values.name,
        mobile: values.mobile || undefined,
        address: values.address || undefined,
        status: values.status,
      })
      onSuccess(`Shop "${values.name}" created successfully.`)
      onClose()
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        for (const [field, msg] of Object.entries(err.fieldErrors)) {
          if (["name", "mobile", "address"].includes(field)) {
            setError(field as keyof CreateShopFormValues, {
              type: "server",
              message: msg,
            })
          } else {
            setError("root", { type: "server", message: msg })
          }
        }
      } else {
        setError("root", {
          type: "server",
          message: getErrorMessage(err, "Failed to create shop"),
        })
      }
    }
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
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-(--primary)">
              <Store className="size-4" />
            </span>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              Add New Shop
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {errors.root.message}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Shop Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Herbal Vitality BD"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-(--primary) focus:bg-(--bg-surface)"
                {...register("name")}
              />
              {errors.name && <FieldError>{errors.name.message}</FieldError>}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Mobile Number{" "}
                <span className="text-xs font-normal text-(--text-muted)">
                  (optional)
                </span>
              </label>
              <input
                type="tel"
                placeholder="017XXXXXXXX"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-all outline-none focus:border-(--primary) focus:bg-(--bg-surface)"
                {...register("mobile")}
              />
              {errors.mobile && (
                <FieldError>{errors.mobile.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Address{" "}
                <span className="text-xs font-normal text-(--text-muted)">
                  (optional)
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="Full shop address"
                className="block w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-sm transition-all outline-none focus:border-(--primary) focus:bg-(--bg-surface)"
                {...register("address")}
              />
              {errors.address && (
                <FieldError>{errors.address.message}</FieldError>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Initial Status
              </label>
              <select
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                {...register("status")}
              >
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
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
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <Store className="size-3.5" />
              {isSubmitting ? "Creating..." : "Create Shop"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
