/** Shop option for the Add Product shop-selector dropdown. */
export type ShopOption = {
  id: number
  name: string
  slug: string
}

/** Three-state product status — derived from `isActive` + `isBlocked`. */
export type SuperAdminProductStatus = "active" | "inactive" | "blocked"

export type SuperAdminProductVariant = {
  id?: number
  size: string | null
  color: string | null
  sku: string | null
  price: number
  stock: number
}

export type SuperAdminProductSeo = {
  metaTitle?: string | null
  metaDescription?: string | null
  keywords?: string | null
}

export type SuperAdminProductSpecification = {
  key: string
  value: string
}

/**
 * Super Admin product row — the shape returned by the super product list/detail
 * endpoints, including shop context and the block flag. `shopName` is always
 * normalized by `superAdminProductsApi` from `shop?.name`.
 */
export type SuperAdminProduct = {
  id: number
  name: string
  slug: string
  brandName: string
  category: string
  subcategory?: string | null
  section?: string | null
  sku?: string | null
  badge?: string | null
  shortDescription?: string | null
  description?: string | null
  currentPrice: number
  regularPrice: number
  buyingPrice?: number | null
  discountPercent?: number | null
  stockQuantity: number
  inStock?: boolean
  salesCount?: number
  images: string[]
  isActive: boolean
  isBlocked: boolean
  productType?: string
  sizeOptions?: string[]
  colorOptions?: string[]
  variants?: SuperAdminProductVariant[]
  isFeatured?: boolean
  isFreeShipping?: boolean
  enableStockAlert?: boolean
  stockAlertQty?: number | null
  maxOrderQty?: number | null
  rank?: number | null
  seo?: SuperAdminProductSeo | null
  specifications?: SuperAdminProductSpecification[]
  shopId: number
  shopName: string
  shop?: { id: number; name: string; slug: string } | null
  createdAt: string
  updatedAt: string
}

/**
 * Single source of truth for the 3-state display.
 * Blocked takes priority over isActive — a blocked product cannot be
 * "Active" even if `isActive` is true, because it's frozen by the platform.
 */
export function getSuperAdminProductStatus(
  product: SuperAdminProduct
): SuperAdminProductStatus {
  if (product.isBlocked) return "blocked"
  return product.isActive ? "active" : "inactive"
}
