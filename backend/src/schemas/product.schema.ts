import { z } from "zod";

const MAX_PRICE = 10_000_000;
const MAX_STOCK_QUANTITY = 1_000_000;

export const productInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Enter a product name.")
      .max(200, "Product name must be 200 characters or fewer."),
    brandName: z
      .string()
      .trim()
      .min(1, "Enter a brand name.")
      .max(100, "Brand name must be 100 characters or fewer."),
    category: z
      .string()
      .trim()
      .min(1, "Enter a category.")
      .max(100, "Category must be 100 characters or fewer."),
    slug: z
      .string()
      .trim()
      .min(1, "Enter a slug.")
      .max(100, "Slug must be 100 characters or fewer.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens only.",
      ),
    regularPrice: z
      .number({ error: "Enter a regular price." })
      .int("Enter a whole number.")
      .min(1, "Regular price must be at least 1.")
      .max(MAX_PRICE, "Regular price is too large."),
    currentPrice: z
      .number({ error: "Enter a current price." })
      .int("Enter a whole number.")
      .min(1, "Current price must be at least 1.")
      .max(MAX_PRICE, "Current price is too large."),
    stockQuantity: z
      .number({ error: "Enter a stock quantity." })
      .int("Enter a whole number.")
      .min(0, "Stock quantity cannot be negative.")
      .max(MAX_STOCK_QUANTITY, "Stock quantity is too large."),
    images: z
      .array(z.string().trim().min(1, "Enter an image URL or path."))
      .min(1, "Add at least one product image.")
      .max(10, "You can add up to 10 product images."),
    isActive: z.boolean({ error: "Enter a valid active status." }).optional(),
  })
  .superRefine(({ currentPrice, regularPrice }, context) => {
    if (currentPrice > regularPrice) {
      context.addIssue({
        code: "custom",
        message: "Current price cannot exceed regular price.",
        path: ["currentPrice"],
      });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;

export function formatProductValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "form";

    if (!(field in errors)) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
