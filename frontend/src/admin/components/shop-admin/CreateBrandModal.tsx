import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { Layers, ImageIcon } from "lucide-react"
import { FieldError, FormToggle } from "../settings/SettingsField"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import type { BrandWriteInput } from "../../types/catalog"

const createBrandSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  logoUrl: z
    .string()
    .trim()
    .refine(
      (v) =>
        !v ||
        (v.startsWith("/") && !v.startsWith("//")) ||
        v.startsWith("https://") ||
        v.startsWith("http://"),
      "Must start with /, http:// or https://"
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

type CreateBrandModalProps = {
  open: boolean
  isPending?: boolean
  error?: string | null
  fieldErrors?: Record<string, string> | null
  onClearError?: () => void
  onClose: () => void
  onSubmit: (input: BrandWriteInput) => Promise<void> | void
}

export function CreateBrandModal({
  open,
  isPending = false,
  error,
  fieldErrors,
  onClearError,
  onClose,
  onSubmit,
}: CreateBrandModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateBrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: EMPTY,
  })

  useEffect(() => {
    if (open) reset(EMPTY)
  }, [open, reset])

  useEffect(() => {
    if (!open || !fieldErrors) return
    for (const field of ["name", "logoUrl", "description"] as const) {
      const message = fieldErrors[field]
      if (message) setError(field, { type: "server", message })
    }
  }, [fieldErrors, open, setError])

  const busy = isSubmitting || isPending
  useEscapeKey(onClose, open && !busy)

  if (!open) return null

  const submitForm = async (values: CreateBrandFormValues) => {
    await onSubmit({
      name: values.name,
      logoUrl: values.logoUrl || null,
      description: values.description || null,
      isActive: values.isActive,
    })
  }

  const logoValue = watch("logoUrl")
  const isActiveValue = watch("isActive")

  return (
    <DialogShell
      title="Add Brand"
      icon={<Layers className="size-4" />}
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
                  placeholder="/uploads/logo.png or https://example.com/logo.png"
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
            <Layers className="size-3.5" />
            {busy ? "Creating..." : "Create Brand"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
