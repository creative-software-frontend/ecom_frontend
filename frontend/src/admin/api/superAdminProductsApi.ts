import { apiRequest, ApiError } from "./client"
import { buildQueryString, withQuery } from "./queryParams"
import { getErrorMessage } from "../lib/errors"
import type { ProductFormValues } from "../schemas/productSchema"
import type { SuperAdminProduct } from "../types/superAdminProduct"

const BASE = "/admin/super/products"

export type SuperAdminProductListParams = {
  shopId?: number
  q?: string
  status?: string
  category?: string
}

/** Raw API row — the backend nests the shop relation instead of `shopName`. */
type RawSuperAdminProduct = Omit<SuperAdminProduct, "shopName"> & {
  shopName?: string
}

type SuperAdminVariantPayload = {
  size?: string
  color?: string
  sku?: string
  price: number
  stock: number
}

type SuperAdminProductPayload = {
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
  variants?: SuperAdminVariantPayload[]
  shopId?: number
}

function normalizeProduct(raw: RawSuperAdminProduct): SuperAdminProduct {
  return {
    ...raw,
    shopName: raw.shopName ?? raw.shop?.name ?? "",
  }
}

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
 */
export function toSuperAdminProductPayload(
  values: ProductFormValues
): SuperAdminProductPayload {
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

  const variants: SuperAdminVariantPayload[] | undefined =
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
    shopId: values.shopId ?? undefined,
  }
}

export const superAdminProductsApi = {
  async list(
    params: SuperAdminProductListParams = {},
    signal?: AbortSignal
  ): Promise<SuperAdminProduct[]> {
    const qs = buildQueryString({
      shopId: params.shopId,
      q: params.q?.trim(),
      status: params.status,
      category: params.category,
    })
    const products = await apiRequest<RawSuperAdminProduct[]>(
      withQuery(BASE, qs),
      { signal }
    )
    return products.map(normalizeProduct)
  },

  async get(
    id: number | string,
    signal?: AbortSignal
  ): Promise<SuperAdminProduct> {
    const raw = await apiRequest<RawSuperAdminProduct>(
      `${BASE}/${encodeURIComponent(String(id))}`,
      { signal }
    )
    return normalizeProduct(raw)
  },

  create(input: ProductFormValues): Promise<SuperAdminProduct> {
    return apiRequest<RawSuperAdminProduct>(BASE, {
      method: "POST",
      body: toSuperAdminProductPayload(input),
    }).then(normalizeProduct)
  },

  update(
    id: number | string,
    input: ProductFormValues
  ): Promise<SuperAdminProduct> {
    return apiRequest<RawSuperAdminProduct>(
      `${BASE}/${encodeURIComponent(String(id))}`,
      {
        method: "PUT",
        body: toSuperAdminProductPayload(input),
      }
    ).then(normalizeProduct)
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(`${BASE}/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    })
  },

  block(id: number | string): Promise<SuperAdminProduct> {
    return apiRequest<RawSuperAdminProduct>(
      `${BASE}/${encodeURIComponent(String(id))}/block`,
      { method: "PATCH" }
    ).then(normalizeProduct)
  },

  unblock(id: number | string): Promise<SuperAdminProduct> {
    return apiRequest<RawSuperAdminProduct>(
      `${BASE}/${encodeURIComponent(String(id))}/unblock`,
      { method: "PATCH" }
    ).then(normalizeProduct)
  },
}

export const superAdminProductQueryKeys = {
  all: ["admin", "super", "products"] as const,
  lists: () => [...superAdminProductQueryKeys.all, "list"] as const,
  list: (params: SuperAdminProductListParams = {}) =>
    [...superAdminProductQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...superAdminProductQueryKeys.all, "detail", id] as const,
}

/** Keeps the backend's field-level messages visible when the form cannot bind them. */
export function describeSuperAdminProductError(
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
