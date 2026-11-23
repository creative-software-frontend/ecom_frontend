import { z } from "zod";

const MAX_PRICE = 10_000_000;
const MAX_STOCK_QUANTITY = 1_000_000;

const variantSchema = z.object({
  size: z.string().trim().max(50).optional(),
  color: z.string().trim().max(50).optional(),
  sku: z.string().trim().max(50).optional(),
  price: z.number().int().min(0),
  stock: z.number().int().min(0),
});

/**
 * Base shape before transformation. `.refine` runs BEFORE `.transform`
 * so it sees the original field names (sellingPrice, regularPrice).
 */
const baseProductSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a product name.").max(200),
    sku: z
      .string()
      .trim()
      .max(50)
      .regex(/^[A-Z0-9]*$/, "SKU must be uppercase letters and numbers only.")
      .optional(),
    badge: z.string().trim().max(50).optional(),
    category: z.string().trim().min(1, "Enter a category.").max(100),
    subcategory: z.string().trim().max(100).optional(),
    brand: z.string().trim().max(100).optional(),
    section: z.string().trim().max(100).optional(),
    shortDescription: z.string().trim().max(300).optional(),
    description: z.string().optional(),

    sellingPrice: z
      .number({ error: "Enter a selling price." })
      .int()
      .min(1)
      .max(MAX_PRICE),
    regularPrice: z
      .number({ error: "Enter a regular price." })
      .int()
      .min(1)
      .max(MAX_PRICE),
    buyingPrice: z.number().int().min(0).max(MAX_PRICE).optional(),

    stock: z.number().int().min(0).max(MAX_STOCK_QUANTITY).optional(),

    productType: z.enum(["single", "variant"], {
      error: "Select a valid product type.",
    }),
    inStock: z.boolean().default(true),
    isPublic: z.boolean().default(true),
    isFeatured: z.boolean().default(false).optional(),
    isFreeShipping: z.boolean().default(false).optional(),
    enableStockAlert: z.boolean().default(false).optional(),
    stockAlertQty: z.number().int().min(0).optional(),
    maxOrderQty: z.number().int().min(0).optional(),
    rank: z.number().int().min(0).optional(),

    images: z
      .array(
        z
          .string()
          .trim()
          .min(1)
          .max(500)
          .refine(
            (v) =>
              (v.startsWith("/") && !v.startsWith("//")) ||
              v.startsWith("https://"),
            "Image URL or path must start with / or https://.",
          ),
      )
      .min(1, "Add at least one product image.")
      .max(10, "Maximum 10 images."),

    specifications: z
      .array(
        z.object({
          key: z.string().trim().min(1),
          value: z.string().trim().min(1),
        }),
      )
      .max(20)
      .optional(),

    seo: z
      .object({
        metaTitle: z.string().trim().max(300).optional(),
        metaDescription: z.string().trim().max(300).optional(),
        keywords: z.string().trim().max(300).optional(),
      })
      .optional(),

    sizeOptions: z.array(z.string().trim().min(1)).max(20).optional(),
    colorOptions: z.array(z.string().trim().min(1)).max(20).optional(),
    variants: z.array(variantSchema).max(200).optional(),

    shopId: z.number().int().positive().optional(),
  })
  // Price ordering check — runs on ORIGINAL field names (before transform)
  .refine((data) => data.regularPrice >= data.sellingPrice, {
    message: "Regular price must be ≥ selling price.",
    path: ["regularPrice"],
  })
  // Variant cross-field rules — also pre-transform
  .refine(
    (data) =>
      data.productType !== "variant" ||
      (data.variants && data.variants.length > 0),
    {
      message: "Add at least one variant for a variant product.",
      path: ["variants"],
    },
  )
  .refine(
    (data) =>
      data.productType !== "single" ||
      !data.variants ||
      data.variants.length === 0,
    {
      message: "Single products cannot have variants.",
      path: ["variants"],
    },
  );

/**
 * Final schema — transforms input names to DB names.
 *   brand → brandName
 *   sellingPrice → currentPrice
 *   stock → stockQuantity
 *   isPublic → isActive
 */
export const productInputSchema = baseProductSchema.transform(
  ({ brand, sellingPrice, stock, isPublic, ...rest }) => ({
    ...rest,
    ...(brand !== undefined && { brandName: brand }),
    currentPrice: sellingPrice,
    ...(stock !== undefined && { stockQuantity: stock }),
    isActive: isPublic,
  }),
);

/** Backward-compat alias — other files import `productSchema`. */
export const productSchema = productInputSchema;

export type ProductInput = z.infer<typeof productInputSchema>;

export function formatProductValidationErrors(
  error: z.ZodError,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = typeof issue.path[0] === "string" ? issue.path[0] : "form";
    if (!(field in errors)) errors[field] = issue.message;
  }
  return errors;
}
