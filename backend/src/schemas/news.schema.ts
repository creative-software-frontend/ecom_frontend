import { z } from "zod";
import { fieldErrorsFromZod } from "../lib/validation.js";

/* ================================================================
   News & announcements. Categories and statuses mirror the string
   columns on the News table; validation stays server-side so a
   crafted request can never write an unknown value.
   ================================================================ */

export const NEWS_CATEGORIES = [
  "charge",
  "integration",
  "notice",
  "general",
] as const;
export const NEWS_STATUSES = ["published", "draft"] as const;

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters")
  .max(300, "Title must be 300 characters or fewer");

/** Blank strings and explicit nulls are normalised to null; omitted stays undefined. */
const descriptionSchema = z
  .union([
    z
      .string()
      .trim()
      .max(3000, "Description must be 3000 characters or fewer"),
    z.null(),
  ])
  .optional()
  .transform((value) =>
    value === undefined
      ? undefined
      : value === null || value === ""
        ? null
        : value,
  );

function parseNewsDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Date-only values are stored as UTC midnight so the stored day does not
  // shift when the server runs in a timezone other than Asia/Dhaka.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== trimmed
    ) {
      return null;
    }
    return date;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

const publishedAtSchema = z
  .string()
  .trim()
  .refine(
    (value) => parseNewsDate(value) !== null,
    "Published date must be a valid YYYY-MM-DD or ISO date",
  )
  .transform((value) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : new Date(value),
  )
  .optional();

export const createNewsSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  category: z.enum(NEWS_CATEGORIES).default("general"),
  isPinned: z.boolean().default(false),
  status: z.enum(NEWS_STATUSES).default("published"),
  publishedAt: publishedAtSchema,
});

/**
 * Partial update: omitted fields are left untouched. Fields with defaults
 * in the create schema have no default here so a partial body cannot reset
 * them accidentally.
 */
export const updateNewsSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema,
    category: z.enum(NEWS_CATEGORIES).optional(),
    isPinned: z.boolean().optional(),
    status: z.enum(NEWS_STATUSES).optional(),
    publishedAt: publishedAtSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Provide at least one field to update",
    path: ["form"],
  });

export const newsListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z
    .enum(["all", "charge", "integration", "notice", "general"])
    .default("all"),
  status: z.enum(["all", "published", "draft"]).default("all"),
});

export const shopNewsListQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z
    .enum(["all", "charge", "integration", "notice", "general"])
    .default("all"),
});

export function formatNewsValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  return fieldErrorsFromZod(error);
}

export type NewsInput = z.infer<typeof createNewsSchema>;
export type NewsUpdateInput = z.infer<typeof updateNewsSchema>;
