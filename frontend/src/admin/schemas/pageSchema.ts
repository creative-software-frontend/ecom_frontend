import { z } from "zod"

/* ================================================================
   Page editor form — title/language/status are registered with RHF;
   content_html lives in the contentEditable div and is tracked
   separately by PagesTab. Slug is read-only, so it is only displayed.
   ================================================================ */

export const PAGE_LANGUAGES = ["EN", "BN", "EN / BN"] as const
export const PAGE_STATUSES = ["published", "draft"] as const

export const pageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150, "Title must be 150 characters or less"),
  slug: z.string().optional(),
  language: z.enum(PAGE_LANGUAGES),
  status: z.enum(PAGE_STATUSES),
})

export type PageFormValues = z.infer<typeof pageSchema>

/** Create modal — blank slug means the server derives it from the title. */
export const createPageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(150, "Title must be 150 characters or less"),
  slug: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      "Use lowercase letters, numbers, and hyphens only"
    )
    .refine((value) => value.length <= 100, "Slug must be 100 characters or less"),
  language: z.enum(PAGE_LANGUAGES),
  status: z.enum(PAGE_STATUSES),
})

export type CreatePageFormValues = z.infer<typeof createPageSchema>
