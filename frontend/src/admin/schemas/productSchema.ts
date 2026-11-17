import { z } from "zod"

export const productFormSchema = z.object({
  // Basic Info
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  category: z.string().trim().min(1, "Category is required"),
  subcategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  section: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  description: z.string().optional(),

  // Pricing & Stock
  sellingPrice: z.number().min(1, "Selling price is required"),
  regularPrice: z.number().optional(),
  buyingPrice: z.number().optional(),
  stock: z.number().min(0).optional(),

  // Type & Visibility
  productType: z.enum(["single", "variant"]).default("single"),
  inStock: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isFreeShipping: z.boolean().default(false),

  // Stock Alert
  enableStockAlert: z.boolean().default(false),
  stockAlertQty: z.number().optional(),
  maxOrderQty: z.number().optional(),
  rank: z.number().optional(),

  // Images
  images: z
    .array(z.string().url("Must be a valid URL"))
    .min(1, "At least one image is required"),

  // Specifications
  specifications: z
    .array(
      z.object({
        key: z.string().min(1, "Key is required"),
        value: z.string().min(1, "Value is required"),
      })
    )
    .optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  keywords: z.string().optional(),

  // Variants (UI only for now)
  sizeOptions: z.array(z.string()).optional(),
  colorOptions: z.array(z.string()).optional(),
  variants: z
    .array(
      z.object({
        id: z.string(),
        size: z.string(),
        color: z.string(),
        price: z.number(),
        sku: z.string(),
        stock: z.number(),
      })
    )
    .optional(),
  shopId: z.number().nullable().optional(),
})

export type ProductFormInput = z.input<typeof productFormSchema>
export type ProductFormValues = z.output<typeof productFormSchema>
