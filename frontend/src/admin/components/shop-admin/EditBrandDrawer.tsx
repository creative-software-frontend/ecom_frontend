import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, Layers, Lock, ImageIcon } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { Brand } from "../../types/catalog"

const editBrandSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  logoUrl: z
    .string()
    .trim()
    .refine(
      (v) => !v || /^https?:\/\//.test(v),
      "Must start with http:// or https://"
    ),
  description: z.string().trim().max(500),
  isActive: z.boolean(),
})

type EditBrandFormValues = z.infer<typeof editBrandSchema>

type EditBrandDrawerProps = {
  open: boolean
  brand: Brand | null
  onClose: () => void
  onSuccess: (updated: Brand) => void
}

export function EditBrandDrawer({
  open,
  brand,
  onClose,
  onSuccess,
}: EditBrandDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditBrandFormValues>({
    resolver: zodResolver(editBrandSchema),
  })

  useEffect(() => {
    if (open && brand) {
      reset({
        name: brand.name,
        logoUrl: brand.logoUrl ?? "",
        description: brand.description ?? "",
        isActive: brand.isActive,
      })
    }
  }, [open, brand, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !brand) return null

  const onSubmit = async (values: EditBrandFormValues) => {
    // Mock save — backend integration later
    await new Promise((r) => setTimeout(r, 300))
    onSuccess({
      ...brand,
      name: values.name,
      logoUrl: values.logoUrl || null,
      description: values.description,
      isActive: values.isActive,
    })
    onClose()
  }

  const logoValue = watch("logoUrl")
  const isActiveValue = watch("isActive")

  return (
    <div
      role="dialog"
      aria-modal="true"
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
              <Layers className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Edit Brand
              </h2>
              <p className="text-[11px] text-(--text-muted)">{brand.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
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
            {/* Logo */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Logo URL
              </label>
              <div className="flex items-start gap-3">
                <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--border-light) bg-(--bg-app)">
                  {logoValue ? (
                    <img
                      src={logoValue}
                      alt="Logo preview"
                      className="size-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  ) : (
                    <ImageIcon className="size-5 text-(--text-muted)" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <input
                    type="text"
                    placeholder="https://example.com/logo.png"
                    className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
                    {...register("logoUrl")}
                  />
                  {errors.logoUrl && (
                    <FieldError>{errors.logoUrl.message}</FieldError>
                  )}
                  <p className="mt-1 text-[10px] text-(--text-muted)">
                    Square logo recommended. PNG, JPG, or SVG.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
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

            {/* Slug */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Slug
              </label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-(--border-light) bg-(--bg-app) px-3">
                <span className="font-mono text-xs text-(--text-muted)">
                  {brand.slug}
                </span>
                <Lock className="ml-auto size-3.5 text-(--text-muted)" />
              </div>
              <p className="mt-1 text-[10px] text-(--text-muted)">
                Auto-generated from name. Cannot be edited.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Short brand description (optional)"
                className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-sm outline-none focus:border-(--primary)"
                {...register("description")}
              />
              {errors.description && (
                <FieldError>{errors.description.message}</FieldError>
              )}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-(--text-primary)">
                  Active
                </p>
                <p className="text-[10px] text-(--text-muted)">
                  Visible in product forms and storefront filters
                </p>
              </div>
              <FormToggle
                checked={isActiveValue}
                onChange={(v) => setValue("isActive", v)}
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
      </div>
    </div>
  )
}
