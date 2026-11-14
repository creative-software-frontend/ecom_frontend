import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, AlertCircle, Store, Info, Lock } from "lucide-react"
import { FieldError } from "../settings/SettingsField"
import { useUpdateShopMutation } from "../../hooks/useAdminUsers"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { ApiError } from "../../api/client"
import type { SuperAdminShopListItem } from "../../types/superAdmin"

// name + mobile only — slug is locked (URL preservation), status via quick action
const editShopSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required").max(150),
  mobile: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^01[3-9]\d{8}$/.test(v),
      "Enter a valid BD mobile number"
    )
    .optional(),
})

type EditShopFormValues = z.infer<typeof editShopSchema>

type EditShopDrawerProps = {
  open: boolean
  shop: SuperAdminShopListItem | null
  onClose: () => void
  onSuccess: (message: string) => void
}

export function EditShopDrawer({
  open,
  shop,
  onClose,
  onSuccess,
}: EditShopDrawerProps) {
  const mutation = useUpdateShopMutation()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditShopFormValues>({
    resolver: zodResolver(editShopSchema),
  })

  useEffect(() => {
    if (open && shop) {
      reset({
        name: shop.name,
        mobile: shop.ownerMobile === "N/A" ? "" : shop.ownerMobile,
      })
    }
  }, [open, shop, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !shop) return null

  async function onSubmit(values: EditShopFormValues) {
    if (!shop) return
    try {
      await mutation.mutateAsync({
        id: shop.id,
        data: {
          name: values.name,
          mobile: values.mobile || undefined,
        },
      })
      onSuccess(`Shop "${values.name}" updated.`)
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
        if (!mapped) setError("root", { type: "server", message: err.message })
      } else {
        setError("root", {
          type: "server",
          message: getErrorMessage(err, "Failed to update shop"),
        })
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-shop-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col border-l border-(--border-light) bg-(--bg-surface) shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-(--primary)">
              <Store className="size-4" />
            </span>
            <div>
              <h2
                id="edit-shop-title"
                className="text-sm font-semibold text-(--text-primary)"
              >
                Edit Shop
              </h2>
              <p className="font-mono text-[11px] text-(--text-muted)">
                {shop.slug}
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
            {errors.root && (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                <span>{errors.root.message}</span>
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
              <p className="mt-1 flex items-start gap-1 text-[11px] text-(--text-muted)">
                <Info className="mt-0.5 size-3 shrink-0" />
                Changing the name does not change the URL slug — existing links
                stay valid.
              </p>
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

            <div className="rounded-md border border-(--border-light) bg-(--bg-app) p-2.5 text-[11px] text-(--text-muted)">
              <span className="flex items-center gap-1.5">
                <Lock className="size-3 shrink-0" />
                URL slug and status are managed separately.
              </span>
            </div>
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
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
            >
              <Save className="size-3.5" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
