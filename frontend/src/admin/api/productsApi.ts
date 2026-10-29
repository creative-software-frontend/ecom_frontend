import { apiRequest } from "./client"
import type { Product, ProductWriteInput } from "../types/product"

export const productsApi = {
  list(signal?: AbortSignal): Promise<Product[]> {
    return apiRequest<Product[]>("/admin/products", { signal })
  },

  get(id: string, signal?: AbortSignal): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${encodeURIComponent(id)}`, {
      signal,
    })
  },

  create(input: ProductWriteInput): Promise<Product> {
    return apiRequest<Product>("/admin/products", {
      method: "POST",
      body: input,
    })
  },

  update(id: string, input: ProductWriteInput): Promise<Product> {
    return apiRequest<Product>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: input,
    })
  },

  remove(id: string): Promise<void> {
    return apiRequest<void>(`/admin/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  },
}
