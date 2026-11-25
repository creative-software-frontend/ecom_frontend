export type Product = {
  id: number
  slug: string
  name: string
  brandName: string
  category: string
  currentPrice: number
  regularPrice: number
  discountPercent: number
  inStock: boolean
  stockQuantity: number
  images: string[]
  isActive: boolean
  salesCount?: number
  createdAt: string
  updatedAt: string

  // Full shop product row (adminProduct.controller.ts returns the Prisma row
  // with `variants` included). All additions are optional so the products
  // list/table keep working with the original compact shape.
  isBlocked?: boolean
  buyingPrice?: number | null
  sku?: string | null
  badge?: string | null
  subcategory?: string | null
  section?: string | null
  shortDescription?: string | null
  description?: string | null
  productType?: "single" | "variant" | string
  sizeOptions?: string[] | null
  colorOptions?: string[] | null
  variants?: Array<{
    id?: number
    size: string | null
    color: string | null
    sku: string | null
    price: number
    stock: number
  }>
  isFeatured?: boolean
  isFreeShipping?: boolean
  enableStockAlert?: boolean
  stockAlertQty?: number | null
  maxOrderQty?: number | null
  rank?: number | null
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
  } | null
  specifications?: Array<{ key: string; value: string }> | null
  shopId?: number
}

/** Variant shape accepted by `backend/src/schemas/product.schema.ts`. */
export type ShopProductVariantPayload = {
  size?: string
  color?: string
  sku?: string
  price: number
  stock: number
}

/**
 * Payload sent to `POST/PUT /api/shop/products`.
 * `shopId` is intentionally absent — the backend scopes it from the auth
 * cookie (`req.user.shopId`).
 */
export type ShopProductWritePayload = {
  name: string
  sku?: string
  badge?: string
  category: string
  subcategory?: string
  brand?: string
  section?: string
  shortDescription?: string
  description?: string
  sellingPrice: number
  regularPrice: number
  buyingPrice?: number
  stock?: number
  productType: "single" | "variant"
  inStock: boolean
  isPublic: boolean
  isFeatured?: boolean
  isFreeShipping?: boolean
  enableStockAlert?: boolean
  stockAlertQty?: number
  maxOrderQty?: number
  rank?: number
  images: string[]
  specifications?: Array<{ key: string; value: string }>
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string
  }
  sizeOptions?: string[]
  colorOptions?: string[]
  variants?: ShopProductVariantPayload[]
}

/** Backward-compatible alias for the previous shop write-input name. */
export type ProductWriteInput = ShopProductWritePayload
