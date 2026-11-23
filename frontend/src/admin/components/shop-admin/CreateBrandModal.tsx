import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { Layers, ImageIcon } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { Brand } from "../../types/catalog"

const createBrandSchema = z.object({
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

type CreateBrandFormValues = z.infer<typeof createBrandSchema>

const EMPTY: CreateBrandFormValues = {
  name: "",
  logoUrl: "",
  description: "",
  isActive: true,
}

/** Slug is always derived server-side from name (per product pattern). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60)
}

type CreateBrandModalProps = {
  open: boolean
  onClose: () => void
  onSuccess: (brand: Brand) => void
}

export function CreateBrandModal({
  open,
  onClose,
  onSuccess,
}: CreateBrandModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateBrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open) return null

  const onSubmit = async (values: CreateBrandFormValues) => {
    await new Promise((r) => setTimeout(r, 300))
    onSuccess({
      id: Date.now(),
      name: values.name,
      slug: slugify(values.name),
      logoUrl: values.logoUrl || null,
      description: values.description,
      productCount: 0,
      isActive: values.isActive,
    })
    onClose()
  }

  const logoValue = watch("logoUrl")
  const isActiveValue = watch("isActive")

  return (
    <DialogShell
      title="Add Brand"
      icon={<Layers className="size-4" />}
      closeButtonClassName="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
      closeDisabled={isSubmitting}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Power Zenox"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("name")}
            />
            {errors.name && <FieldError>{errors.name.message}</FieldError>}
            <p className="mt-1 text-[10px] text-(--text-muted)">
              URL slug will be auto-generated from this name.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Logo URL{" "}
              <span className="text-xs font-normal text-(--text-muted)">
                (optional)
              </span>
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
              </div>
            </div>
          </div>

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

          <div className="flex items-center justify-between rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-(--text-primary)">
                Active
              </p>
              <p className="text-[10px] text-(--text-muted)">
                Show this brand in product forms immediately
              </p>
            </div>
            <FormToggle
              checked={isActiveValue}
              onChange={(v) => setValue("isActive", v)}
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
            <Layers className="size-3.5" />
            {isSubmitting ? "Creating..." : "Create Brand"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
