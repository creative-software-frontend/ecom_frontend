/** Shop option for the Add Product shop-selector dropdown. */
export type ShopOption = {
  id: number
  name: string
  slug: string
}

/** Three-state product status — derived from `isActive` + `isBlocked`. */
export type SuperAdminProductStatus = "active" | "inactive" | "blocked"

/**
 * Super Admin product row — extends the base Product with shop context
 * and block flag. In production, this will be `Product & { shop: Shop }`.
 * Mock data uses this shape directly.
 */
export type SuperAdminProduct = {
  id: number
  name: string
  slug: string
  brandName: string
  category: string
  currentPrice: number
  regularPrice: number
  stockQuantity: number
  images: string[]
  isActive: boolean
  isBlocked: boolean
  shopId: number
  shopName: string
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
