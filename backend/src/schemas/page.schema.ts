import { randomBytes } from "node:crypto";
import { z } from "zod";

/* ================================================================
   Pages CMS input validation.

   Slug is generated once on create and locked afterwards: changing it
   would break inbound links for an already published page.
   ================================================================ */

export const PAGE_STATUSES = ["published", "draft"] as const;
export const PAGE_LANGUAGES = ["EN", "BN", "EN / BN"] as const;

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const pageTitle = z
  .string({ error: "Enter a page title." })
  .trim()
  .min(2, "Title must be at least 2 characters.")
  .max(150, "Title must be 150 characters or fewer.");

const pageContent = z
  .string({ error: "Content must be HTML text." })
  .max(200000, "Content is too large (200,000 character limit).");

/** Blank input means "derive the slug from the title on the server". */
const pageSlug = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized === "" ? undefined : normalized;
  },
  z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .max(100, "Slug must be 100 characters or fewer.")
    .regex(
      SLUG_PATTERN,
      "Use lowercase letters, numbers and hyphens only (no leading/trailing hyphen).",
    )
    .optional(),
);

export const createPageSchema = z.object({
  title: pageTitle,
  slug: pageSlug,
  contentHtml: pageContent.default(""),
  status: z
    .enum(PAGE_STATUSES, { error: "Select a valid page status." })
    .default("draft"),
  language: z
    .enum(PAGE_LANGUAGES, { error: "Select a valid page language." })
    .default("EN"),
});

export const updatePageSchema = z.object({
  title: pageTitle,
  contentHtml: pageContent,
  // Accepted only so the controller can reject a changed value explicitly.
  slug: z.string().optional(),
  status: z
    .enum(PAGE_STATUSES, { error: "Select a valid page status." })
    .optional(),
  language: z
    .enum(PAGE_LANGUAGES, { error: "Select a valid page language." })
    .optional(),
});

export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;

/** ASCII kebab-case, with a random fallback for non-Latin titles. */
export function generatePageSlug(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100)
    .replace(/-+$/g, "");

  return slug.length >= 2
    ? slug
    : `page-${randomBytes(3).toString("hex").slice(0, 6)}`;
}

/** Field-level 422 errors, matching coupon.schema.ts / order.schema.ts. */
export function formatPageValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "form";
    if (!(field in errors)) errors[field] = issue.message;
  }

  return errors;
}
