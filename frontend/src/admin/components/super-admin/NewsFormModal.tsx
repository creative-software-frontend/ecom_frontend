import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Megaphone } from "lucide-react"
import { z } from "zod"
import { ApiError } from "../../api/client"
import {
  NEWS_CATEGORIES,
  NEWS_STATUSES,
  superNewsApi,
  superNewsQueryKeys,
  type NewsItemDto,
} from "../../api/newsApi"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import {
  FieldError,
  FieldLabel,
  FormField,
  FormTextarea,
  FormToggle,
} from "../settings/SettingsField"

const DHAKA_TIMEZONE = "Asia/Dhaka"
const dateInputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DHAKA_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function toDateInputValue(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ""
  const parts = dateInputFormatter.formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? ""
  return `${part("year")}-${part("month")}-${part("day")}`
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  )
}

const newsFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(300, "Title must be 300 characters or fewer"),
  description: z
    .string()
    .trim()
    .max(3000, "Description must be 3000 characters or fewer"),
  category: z.enum(NEWS_CATEGORIES),
  status: z.enum(NEWS_STATUSES),
  isPinned: z.boolean(),
  publishedAt: z
    .string()
    .trim()
    .refine(isValidDateInput, "Enter a valid date"),
})

type NewsFormValues = z.input<typeof newsFormSchema>

const formFieldNames: readonly (keyof NewsFormValues)[] = [
  "title",
  "description",
  "category",
  "status",
  "isPinned",
  "publishedAt",
]

function isFormField(field: string): field is keyof NewsFormValues {
  return formFieldNames.some((name) => name === field)
}

type NewsFormModalProps = {
  open: boolean
  news: NewsItemDto | null
  onClose: () => void
  onSaved: (message: string) => void
}

export function NewsFormModal({
  open,
  news,
  onClose,
  onSaved,
}: NewsFormModalProps) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      status: "published",
      isPinned: false,
      publishedAt: toDateInputValue(new Date()),
    },
  })

  const mutation = useMutation({
    mutationFn: (input: z.output<typeof newsFormSchema>) =>
      news
        ? superNewsApi.update(news.id, {
            title: input.title,
            description: input.description || null,
            category: input.category,
            status: input.status,
            isPinned: input.isPinned,
            publishedAt: input.publishedAt,
          })
        : superNewsApi.create({
            title: input.title,
            description: input.description || null,
            category: input.category,
            status: input.status,
            isPinned: input.isPinned,
            publishedAt: input.publishedAt,
          }),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: superNewsQueryKeys.all })
      onSaved(
        news
          ? `Announcement "${saved.title}" updated.`
          : `Announcement "${saved.title}" created.`
      )
      onClose()
    },
  })

  useEffect(() => {
    if (!open) return
    setServerError(null)
    reset({
      title: news?.title ?? "",
      description: news?.description ?? "",
      category: news?.category ?? "general",
      status: news?.status ?? "published",
      isPinned: news?.isPinned ?? false,
      publishedAt: news
        ? toDateInputValue(news.publishedAt)
        : toDateInputValue(new Date()),
    })
  }, [open, news, reset])

  const pending = mutation.isPending || isSubmitting
  useEscapeKey(onClose, open && !pending)

  if (!open) return null

  function submit(values: NewsFormValues) {
    setServerError(null)
    mutation.mutate(values, {
      onError: (error: unknown) => {
        if (error instanceof ApiError && error.fieldErrors) {
          for (const [field, message] of Object.entries(error.fieldErrors)) {
            if (isFormField(field)) {
              setError(field, { type: "server", message })
            } else {
              setServerError(message)
            }
          }
        } else {
          setServerError(
            getErrorMessage(error, "Failed to save the announcement.")
          )
        }
      },
    })
  }

  return (
    <DialogShell
      title={news ? "Edit Announcement" : "New Announcement"}
      subtitle={
        <p className="mt-0.5 text-xs text-(--text-muted)">
          Posts are visible to every shop when published.
        </p>
      }
      icon={<Megaphone className="size-4" />}
      closeDisabled={pending}
      onClose={onClose}
    >
      <form
        onSubmit={handleSubmit(submit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {serverError && (
            <InlineNotice
              message={serverError}
              variant="error"
              ariaLive="assertive"
              dismissLabel="Dismiss error"
              onDismiss={() => setServerError(null)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
              dismissClassName="text-sm leading-none hover:opacity-70"
            />
          )}

          <FormField
            label="Title"
            required
            maxLength={300}
            placeholder="e.g. Delivery charge update from 1 December"
            error={errors.title?.message}
            {...register("title")}
          />

          <FormTextarea
            label="Description"
            rows={5}
            maxLength={3000}
            showCounter
            placeholder="Optional details for shop users"
            error={errors.description?.message}
            {...register("description")}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel htmlFor="news-category">Category</FieldLabel>
              <select
                id="news-category"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary)"
                {...register("category")}
              >
                <option value="charge">Charge</option>
                <option value="integration">Integration</option>
                <option value="notice">Notice</option>
                <option value="general">General</option>
              </select>
              {errors.category && (
                <FieldError>{errors.category.message}</FieldError>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="news-status">Status</FieldLabel>
              <select
                id="news-status"
                className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary)"
                {...register("status")}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              {errors.status && <FieldError>{errors.status.message}</FieldError>}
            </div>
          </div>

          <FormField
            label="Published date"
            required
            type="date"
            error={errors.publishedAt?.message}
            {...register("publishedAt")}
          />

          <div className="flex items-center justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2.5">
            <div>
              <p className="text-sm font-semibold text-(--text-primary)">
                Pin announcement
              </p>
              <p className="text-xs text-(--text-muted)">
                Pinned posts appear first in the shop news feed.
              </p>
            </div>
            <Controller
              control={control}
              name="isPinned"
              render={({ field }) => (
                <FormToggle
                  checked={field.value}
                  onChange={field.onChange}
                  aria-label="Pin announcement"
                />
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
          >
            <Megaphone className="size-3.5" />
            {pending
              ? "Saving..."
              : news
                ? "Save changes"
                : "Create announcement"}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
