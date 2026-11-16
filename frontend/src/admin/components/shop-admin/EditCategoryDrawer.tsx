import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, FolderTree, Lock } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { Category } from "../../types/catalog"

const editCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  description: z.string().trim().max(500),
  isActive: z.boolean(),
})

type EditCategoryFormValues = z.infer<typeof editCategorySchema>

type EditCategoryDrawerProps = {
  open: boolean
  category: Category | null
  onClose: () => void
  onSuccess: (updated: Category) => void
}

export function EditCategoryDrawer({
  open,
  category,
  onClose,
  onSuccess,
}: EditCategoryDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditCategoryFormValues>({
    resolver: zodResolver(editCategorySchema),
  })

  useEffect(() => {
    if (open && category) {
      reset({
        name: category.name,
        description: category.description ?? "",
        isActive: category.isActive,
      })
    }
  }, [open, category, reset])

  useEscapeKey(onClose, open && !isSubmitting)

  if (!open || !category) return null

  const onSubmit = async (values: EditCategoryFormValues) => {
    await new Promise((r) => setTimeout(r, 300))
    onSuccess({
      ...category,
      name: values.name,
      description: values.description,
      isActive: values.isActive,
    })
    onClose()
  }

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
              <FolderTree className="size-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Edit Category
              </h2>
              <p className="text-[11px] text-(--text-muted)">{category.name}</p>
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
                Slug
              </label>
              <div className="flex h-9 items-center gap-2 rounded-md border border-(--border-light) bg-(--bg-app) px-3">
                <span className="font-mono text-xs text-(--text-muted)">
                  {category.slug}
                </span>
                <Lock className="ml-auto size-3.5 text-(--text-muted)" />
              </div>
              <p className="mt-1 text-[10px] text-(--text-muted)">
                Auto-generated from name. Cannot be edited.
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
                Description
              </label>
              <textarea
                rows={3}
                placeholder="Short category description (optional)"
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
