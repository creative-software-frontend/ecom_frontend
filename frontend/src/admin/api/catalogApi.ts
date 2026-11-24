import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"
import type {
  Brand,
  BrandListParams,
  BrandListResponse,
  BrandWriteInput,
  Category,
  CategoryListParams,
  CategoryListResponse,
  CategoryWriteInput,
  SuperCatalogOptions,
} from "../types/catalog"

export const brandsApi = {
  list(
    params: BrandListParams = {},
    signal?: AbortSignal
  ): Promise<BrandListResponse> {
    const qs = buildQueryString({ q: params.q?.trim(), status: params.status })
    return apiRequest<BrandListResponse>(withQuery("/shop/brands", qs), {
      signal,
    })
  },

  create(input: BrandWriteInput): Promise<Brand> {
    return apiRequest<Brand>("/shop/brands", { method: "POST", body: input })
  },

  update(id: number | string, input: BrandWriteInput): Promise<Brand> {
    return apiRequest<Brand>(`/shop/brands/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      body: input,
    })
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(`/shop/brands/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    })
  },
}

export const brandQueryKeys = {
  all: ["admin", "brands"] as const,
  lists: () => [...brandQueryKeys.all, "list"] as const,
  list: (params: BrandListParams = {}) =>
    [...brandQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...brandQueryKeys.all, "detail", id] as const,
}

export const categoriesApi = {
  list(
    params: CategoryListParams = {},
    signal?: AbortSignal
  ): Promise<CategoryListResponse> {
    const qs = buildQueryString({
      q: params.q?.trim(),
      status: params.status,
      level: params.level,
    })
    return apiRequest<CategoryListResponse>(withQuery("/shop/categories", qs), {
      signal,
    })
  },

  create(input: CategoryWriteInput): Promise<Category> {
    return apiRequest<Category>("/shop/categories", {
      method: "POST",
      body: input,
    })
  },

  update(id: number | string, input: CategoryWriteInput): Promise<Category> {
    return apiRequest<Category>(
      `/shop/categories/${encodeURIComponent(String(id))}`,
      { method: "PUT", body: input }
    )
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(
      `/shop/categories/${encodeURIComponent(String(id))}`,
      { method: "DELETE" }
    )
  },
}

export const categoryQueryKeys = {
  all: ["admin", "categories"] as const,
  lists: () => [...categoryQueryKeys.all, "list"] as const,
  list: (params: CategoryListParams = {}) =>
    [...categoryQueryKeys.lists(), params] as const,
  detail: (id: number | string) =>
    [...categoryQueryKeys.all, "detail", id] as const,
}

export const superCatalogApi = {
  getOptions(shopId: number, signal?: AbortSignal): Promise<SuperCatalogOptions> {
    return apiRequest<SuperCatalogOptions>(
      `/admin/super/shops/${encodeURIComponent(String(shopId))}/catalog-options`,
      { signal }
    )
  },
}

export const superCatalogQueryKeys = {
  all: ["admin", "super", "catalog-options"] as const,
  options: (shopId: number) => [...superCatalogQueryKeys.all, shopId] as const,
}
