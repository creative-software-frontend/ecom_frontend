import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { FolderTree } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { CategoryWriteInput } from "../../types/catalog"

const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  parentId: z.string().optional(),
  description: z.string().trim().max(500),
  isActive: z.boolean(),
})

type CreateCategoryFormValues = z.infer<typeof createCategorySchema>

const EMPTY: CreateCategoryFormValues = {
  name: "",
  parentId: "",
  description: "",
  isActive: true,
}

type ParentOption = { id: number; name: string }

type CreateCategoryModalProps = {
  open: boolean
  parentOptions: ParentOption[]
  isPending?: boolean
  error?: string | null
  fieldErrors?: Record<string, string> | null
  onClearError?: () => void
  onClose: () => void
  onSubmit: (input: CategoryWriteInput) => Promise<void> | void
}

export function CreateCategoryModal({
  open,
  parentOptions,
  isPending = false,
  error,
  fieldErrors,
  onClearError,
  onClose,
  onSubmit,
}: CreateCategoryModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryFormValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEffect(() => {
    if (!open || !fieldErrors) return
    for (const field of ["name", "parentId", "description"] as const) {
      const message = fieldErrors[field]
      if (message) setError(field, { type: "server", message })
    }
  }, [fieldErrors, open, setError])

  const busy = isSubmitting || isPending
  useEscapeKey(onClose, open && !busy)

  if (!open) return null

  const submitForm = async (values: CreateCategoryFormValues) => {
    const parentId = values.parentId ? Number(values.parentId) : null
    await onSubmit({
      name: values.name,
      parentId:
        parentId !== null && Number.isSafeInteger(parentId) ? parentId : null,
      description: values.description || null,
      isActive: values.isActive,
    })
  }

  const isActiveValue = watch("isActive")

  return (
    <DialogShell
      title="Add Category"
      icon={<FolderTree className="size-4" />}
      closeButtonClassName="rounded p-1 text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
      closeDisabled={busy}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(submitForm)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {error && (
            <InlineNotice
              message={error}
              variant="error"
              ariaLive="assertive"
              dismissLabel="Dismiss error"
              onDismiss={onClearError ?? (() => undefined)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
            />
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Herbal Supplement"
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
              Parent Category{" "}
              <span className="text-xs font-normal text-(--text-muted)">
                (optional — leave empty for a top-level category)
              </span>
            </label>
            <select
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
              {...register("parentId")}
            >
              <option value="">Top-level category</option>
              {parentOptions.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </select>
            {errors.parentId && (
              <FieldError>{errors.parentId.message}</FieldError>
            )}
            <p className="mt-1 text-[10px] text-(--text-muted)">
              Only top-level categories can be parents (max 2 levels).
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
                Show this category in product forms immediately
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
            disabled={busy}
            className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover) disabled:opacity-50"
          >
            <FolderTree className="size-3.5" />
            {busy ? "Creating..." : "Create Category"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
