import { ApiError, apiRequest } from "./client"
import { getErrorMessage } from "../lib/errors"
import type { ProductFormValues } from "../schemas/productSchema"
import type {
  Product,
  ShopProductVariantPayload,
  ShopProductWritePayload,
} from "../types/product"

const BASE = "/shop/products"

function cleanText(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** Empty number inputs use `valueAsNumber`, which produces NaN — omit those. */
function cleanNumber(value: number | null | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

/**
 * Map the shared product form output to the keys expected by
 * `backend/src/schemas/product.schema.ts` (which transforms brand → brandName,
 * sellingPrice → currentPrice, stock → stockQuantity and isPublic → isActive).
 * `shopId` is deliberately omitted — shop admins are scoped by auth cookie.
 */
export function toShopProductPayload(
  values: ProductFormValues
): ShopProductWritePayload {
  const seo = {
    metaTitle: cleanText(values.metaTitle),
    metaDescription: cleanText(values.metaDescription),
    keywords: cleanText(values.keywords),
  }
  const hasSeo = Object.values(seo).some((value) => value !== undefined)

  const specifications = (values.specifications ?? [])
    .map((row) => ({
      key: cleanText(row.key) ?? "",
      value: cleanText(row.value) ?? "",
    }))
    .filter((row) => row.key && row.value)

  const variants: ShopProductVariantPayload[] | undefined =
    values.productType === "variant"
      ? (values.variants ?? []).map((variant) => ({
          ...(cleanText(variant.size) !== undefined && {
            size: cleanText(variant.size),
          }),
          ...(cleanText(variant.color) !== undefined && {
            color: cleanText(variant.color),
          }),
          ...(cleanText(variant.sku) !== undefined && {
            sku: cleanText(variant.sku),
          }),
          price: cleanNumber(variant.price) ?? 0,
          stock: cleanNumber(variant.stock) ?? 0,
        }))
      : undefined

  return {
    name: values.name,
    sku: cleanText(values.sku),
    badge: cleanText(values.badge),
    category: values.category,
    subcategory: cleanText(values.subcategory),
    brand: cleanText(values.brand),
    section: cleanText(values.section),
    shortDescription: cleanText(values.shortDescription),
    description: values.description?.trim() || undefined,
    sellingPrice: values.sellingPrice,
    // The backend requires regularPrice and regularPrice >= sellingPrice.
    regularPrice: cleanNumber(values.regularPrice) ?? values.sellingPrice,
    buyingPrice: cleanNumber(values.buyingPrice),
    stock: cleanNumber(values.stock),
    productType: values.productType,
    inStock: values.inStock,
    isPublic: values.isPublic,
    isFeatured: values.isFeatured,
    isFreeShipping: values.isFreeShipping,
    enableStockAlert: values.enableStockAlert,
    stockAlertQty: cleanNumber(values.stockAlertQty),
    maxOrderQty: cleanNumber(values.maxOrderQty),
    rank: cleanNumber(values.rank),
    images: (values.images ?? []).map((image) => image.trim()).filter(Boolean),
    specifications: specifications.length ? specifications : undefined,
    seo: hasSeo ? seo : undefined,
    sizeOptions: values.sizeOptions?.length ? values.sizeOptions : undefined,
    colorOptions: values.colorOptions?.length ? values.colorOptions : undefined,
    variants: variants?.length ? variants : undefined,
  }
}

/** Keeps the backend's field-level messages visible when the form cannot bind them. */
export function describeShopProductError(
  error: unknown,
  fallback: string
): string {
  if (error instanceof ApiError) {
    const details = error.fieldErrors
      ? Object.values(error.fieldErrors).join(" ")
      : ""
    return details ? `${error.message} — ${details}` : error.message
  }
  return getErrorMessage(error, fallback)
}

export const productsApi = {
  list(signal?: AbortSignal): Promise<Product[]> {
    return apiRequest<Product[]>(BASE, { signal })
  },

  get(id: number | string, signal?: AbortSignal): Promise<Product> {
    return apiRequest<Product>(`${BASE}/${encodeURIComponent(String(id))}`, {
      signal,
    })
  },

  create(values: ProductFormValues): Promise<Product> {
    return apiRequest<Product>(BASE, {
      method: "POST",
      body: toShopProductPayload(values),
    })
  },

  update(id: number | string, values: ProductFormValues): Promise<Product> {
    return apiRequest<Product>(`${BASE}/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      body: toShopProductPayload(values),
    })
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(`${BASE}/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    })
  },
}

export const productQueryKeys = {
  all: ["admin", "products"] as const,
  list: () => [...productQueryKeys.all, "list"] as const,
  detail: (id: number | string) =>
    [...productQueryKeys.all, "detail", id] as const,
}
