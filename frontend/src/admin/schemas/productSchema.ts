import { z } from "zod"
import type { Product } from "../types/product"

export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a product name."),
    brandName: z.string().trim().min(1, "Enter a brand name."),
    category: z.string().trim().min(1, "Enter a category."),
    slug: z
      .string()
      .trim()
      .min(1, "Enter a slug.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Use lowercase letters, numbers, and single hyphens only."
      ),
    regularPrice: z
      .number({ error: "Enter a regular price." })
      .int("Enter a whole number.")
      .min(1, "Regular price must be at least 1."),
    currentPrice: z
      .number({ error: "Enter a current price." })
      .int("Enter a whole number.")
      .min(1, "Current price must be at least 1."),
    stockQuantity: z
      .number({ error: "Enter a stock quantity." })
      .int("Enter a whole number.")
      .min(0, "Stock quantity cannot be negative."),
    isActive: z.boolean(),
    images: z
      .array(
        z.object({
          src: z.string().trim().min(1, "Enter an image URL or path."),
        })
      )
      .min(1, "Add at least one product image."),
  })
  .superRefine(({ currentPrice, regularPrice }, context) => {
    if (currentPrice > regularPrice) {
      context.addIssue({
        code: "custom",
        message: "Current price cannot exceed regular price.",
        path: ["currentPrice"],
      })
    }
  })

export type ProductFormValues = z.infer<typeof productSchema>

export type ProductFormInitialValues = ProductFormValues &
  Partial<Pick<Product, "id">> & {
    createdAt?: string
    updatedAt?: string
  }
