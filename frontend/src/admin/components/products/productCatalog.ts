import type { Product } from "../../types/product"

export const LOW_STOCK_THRESHOLD = 50

export type ProductStockStatus = "in_stock" | "low_stock" | "out_of_stock"

export type ProductStockFilter = "all" | ProductStockStatus
export type ProductStatusFilter = "all" | "active" | "inactive"

export function getProductStockStatus(quantity: number): ProductStockStatus {
  if (quantity <= 0) return "out_of_stock"
  if (quantity <= LOW_STOCK_THRESHOLD) return "low_stock"
  return "in_stock"
}

export function getProductMetrics(products: Product[]) {
  const metrics = {
    activeProducts: 0,
    availableStock: 0,
    lowStockCount: 0,
    catalogAssetValue: 0,
  }

  for (const product of products) {
    if (product.isActive) metrics.activeProducts += 1
    metrics.availableStock += product.stockQuantity
    if (getProductStockStatus(product.stockQuantity) === "low_stock") {
      metrics.lowStockCount += 1
    }
    metrics.catalogAssetValue += product.currentPrice * product.stockQuantity
  }

  return metrics
}

export function filterProducts(
  products: Product[],
  options: {
    query: string
    category: string
    stock: ProductStockFilter
    status: ProductStatusFilter
  }
): Product[] {
  const normalizedQuery = options.query.trim().toLocaleLowerCase()

  return products.filter((product) => {
    const matchesQuery =
      !normalizedQuery ||
      `${product.name} ${product.brandName} ${product.category} ${product.slug}`
        .toLocaleLowerCase()
        .includes(normalizedQuery)
    const matchesCategory =
      options.category === "all" || product.category === options.category
    const matchesStock =
      options.stock === "all" ||
      getProductStockStatus(product.stockQuantity) === options.stock
    const matchesStatus =
      options.status === "all" ||
      (options.status === "active" ? product.isActive : !product.isActive)

    return matchesQuery && matchesCategory && matchesStock && matchesStatus
  })
}
