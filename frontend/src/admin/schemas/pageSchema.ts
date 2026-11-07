import { z } from "zod"

// Title and slug only — content_html is managed outside RHF
// because contentEditable can't be registered cleanly with react-hook-form.
export const pageSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Page title is required")
    .max(200, "Title must be 200 characters or less"),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens only"
    ),
})

export type PageFormValues = z.infer<typeof pageSchema>
