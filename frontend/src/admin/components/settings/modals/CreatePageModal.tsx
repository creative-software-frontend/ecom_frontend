import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, FileText, X } from "lucide-react"
import { FieldError, FormSegmentedControl } from "../SettingsField"
import { InlineNotice } from "../../common/InlineNotice"
import { useEscapeKey } from "../../../hooks/useEscapeKey"
import { ApiError } from "../../../api/client"
import { pagesApi, pageQueryKeys } from "../../../api/pagesApi"
import type { PageDetail } from "../../../types/pages"
import {
  createPageSchema,
  type CreatePageFormValues,
} from "../../../schemas/pageSchema"

const defaultValues: CreatePageFormValues = {
  title: "",
  slug: "",
  language: "EN",
  status: "draft",
}

const serverErrorPaths = {
  title: "title",
  slug: "slug",
  status: "status",
  language: "language",
} as const

/* ================================================================
   CreatePageModal — create a shop-scoped CMS page.
   ================================================================ */

export function CreatePageModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved?: (page: PageDetail) => void
}) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreatePageFormValues>({
    resolver: zodResolver(createPageSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: pagesApi.create,
    onSuccess: (page) => {
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all })
      setFormError(null)
      onSaved?.(page)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        let mapped = false
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          const path = serverErrorPaths[field as keyof typeof serverErrorPaths]
          if (path) {
            setError(path, { type: "server", message })
            mapped = true
          }
        }
        setFormError(mapped ? null : error.message)
        return
      }
      setFormError(
        error instanceof Error ? error.message : "Could not create the page"
      )
    },
  })

  useEffect(() => {
    if (!open) return
    reset(defaultValues)
    setFormError(null)
  }, [open, reset])

  useEscapeKey(onClose, open && !mutation.isPending)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-page-title"
      onMouseDown={() => {
        if (!mutation.isPending) onClose()
      }}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 duration-150 fade-in"
    >
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-lg animate-in flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl duration-150 zoom-in-95 fade-in"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <FileText className="size-4" />
            </span>
            <h2
              id="create-page-title"
              className="text-base font-semibold text-(--text-primary)"
            >
              Add custom page
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            aria-label="Close"
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit((values) => {
            setFormError(null)
            mutation.mutate({
              title: values.title.trim(),
              slug: values.slug.trim() || undefined,
              status: values.status,
              language: values.language,
            })
          })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {formError && (
              <InlineNotice
                variant="error"
                message={formError}
                onDismiss={() => setFormError(null)}
                dismissLabel="Dismiss error"
                className="flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
                dismissClassName="rounded px-1 text-(--status-cancelled-text) hover:bg-(--bg-surface-hover)"
                ariaLive="assertive"
              />
            )}

            <div>
              <label
                htmlFor="new-page-title"
                className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
              >
                Page title
              </label>
              <input
                id="new-page-title"
                type="text"
                maxLength={150}
                placeholder="e.g. Privacy policy"
                className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                {...register("title")}
              />
              {errors.title && <FieldError>{errors.title.message}</FieldError>}
            </div>

            <div>
              <label
                htmlFor="new-page-slug"
                className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
              >
                URL slug <span className="text-(--text-muted)">(optional)</span>
              </label>
              <div className="flex h-9 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-(--primary)/20">
                <span className="text-sm text-(--text-muted)">/</span>
                <input
                  id="new-page-slug"
                  type="text"
                  maxLength={100}
                  placeholder="privacy-policy"
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-(--text-primary) outline-none"
                  {...register("slug")}
                />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-(--text-muted)">
                Leave blank to generate the slug from an English title. For
                Bengali titles, add a custom English slug (e.g. privacy-policy)
                so public links stay readable. The slug cannot be changed later.
              </p>
              {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-(--text-primary)">
                Language
              </label>
              <Controller
                control={control}
                name="language"
                render={({ field }) => (
                  <FormSegmentedControl
                    aria-label="Page language"
                    options={[
                      { value: "EN", label: "English" },
                      { value: "BN", label: "বাংলা" },
                      { value: "EN / BN", label: "Both" },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-(--text-primary)">
                Status
              </label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <FormSegmentedControl
                    aria-label="Page status"
                    options={[
                      { value: "draft", label: "Draft" },
                      { value: "published", label: "Published" },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <p className="mt-1 text-xs text-(--text-muted)">
                You can change this later from the page editor.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-(--border-light) bg-(--bg-surface) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {mutation.isPending ? "Creating..." : "Create page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
