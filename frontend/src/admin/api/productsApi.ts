import { apiRequest } from "./client"
import type { Product, ProductWriteInput } from "../types/product"

export const productsApi = {
  list(signal?: AbortSignal): Promise<Product[]> {
    return apiRequest<Product[]>("/shop/products", { signal })
  },

  get(id: number | string, signal?: AbortSignal): Promise<Product> {
    return apiRequest<Product>(`/shop/products/${encodeURIComponent(id)}`, {
      signal,
    })
  },

  create(input: ProductWriteInput): Promise<Product> {
    return apiRequest<Product>("/shop/products", {
      method: "POST",
      body: input,
    })
  },

  update(id: number | string, input: ProductWriteInput): Promise<Product> {
    return apiRequest<Product>(`/shop/products/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: input,
    })
  },

  remove(id: number | string): Promise<void> {
    return apiRequest<void>(`/shop/products/${encodeURIComponent(id)}`, {
      method: "DELETE",
    })
  },
}
