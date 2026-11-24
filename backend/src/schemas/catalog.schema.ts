import { z } from "zod";
import { fieldErrorsFromZod } from "../lib/validation.js";

/* ================================================================
   Shared helpers. `slug` is never accepted from the client — the
   server generates it on create and locks it on update.
   ================================================================ */

const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or fewer.");

/** Blank strings and explicit nulls are normalised to null; omitted stays undefined. */
function optionalNullableText(max: number, label: string) {
  return z
    .union([
      z
        .string()
        .trim()
        .max(max, `${label} must be ${max} characters or fewer.`),
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
}

const logoUrlSchema = z
  .union([z.string().trim(), z.null()])
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value === null ||
      value === "" ||
      (value.startsWith("/") && !value.startsWith("//")) ||
      value.startsWith("https://") ||
      value.startsWith("http://"),
    "Logo URL must start with /, http:// or https://.",
  )
  .transform((value) =>
    value === undefined
      ? undefined
      : value === null || value === ""
        ? null
        : value,
  );

const parentIdSchema = z
  .number()
  .int("Parent category must be a valid ID")
  .positive("Parent category must be a valid ID")
  .nullable()
  .optional();

/* ================================================================
   Write schemas
   ================================================================ */

export const brandInputSchema = z.object({
  name: nameSchema,
  logoUrl: logoUrlSchema,
  description: optionalNullableText(500, "Description"),
  isActive: z.boolean().default(true),
});

/** Partial update: omitted fields are left untouched, slug is never accepted. */
export const brandUpdateInputSchema = brandInputSchema.extend({
  name: nameSchema.optional(),
  isActive: z.boolean().optional(),
});

export const categoryInputSchema = z.object({
  name: nameSchema,
  parentId: parentIdSchema.default(null),
  description: optionalNullableText(500, "Description"),
  isActive: z.boolean().default(true),
});

/** Partial update: `parentId` has no default so an omitted value cannot detach a child. */
export const categoryUpdateInputSchema = categoryInputSchema.extend({
  name: nameSchema.optional(),
  parentId: parentIdSchema,
  isActive: z.boolean().optional(),
});

/* ================================================================
   List query schemas
   ================================================================ */

export const brandListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
});

export const categoryListQuerySchema = brandListQuerySchema.extend({
  level: z.enum(["all", "parent", "subcategory"]).default("all"),
});

export function formatCatalogValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  return fieldErrorsFromZod(error);
}

export type BrandInput = z.infer<typeof brandInputSchema>;
export type BrandUpdateInput = z.infer<typeof brandUpdateInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateInputSchema>;
