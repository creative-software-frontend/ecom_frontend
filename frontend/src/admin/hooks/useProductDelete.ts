import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { productsApi } from "../api/productsApi"
import { getErrorMessage } from "../lib/errors"
import type { Product } from "../types/product"

/**
 * Encapsulates all delete-related state and side effects for a product.
 * The page component only needs to render the dialog — this hook owns:
 *   - Which product is pending deletion (`target`)
 *   - The error message from the API
 *   - isPending flag
 *   - open/close/confirm handlers
 *
 * `onSuccess` is called after a successful delete so the page can
 * refresh its list (since this page uses useApiQuery-style loading).
 */
export function useProductDelete(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => {
      setTarget(null)
      setError(null)
      // Invalidate caches so sidebar counts and any other views refresh.
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] })
      void queryClient.invalidateQueries({
        queryKey: ["admin", "sidebar-stats"],
      })
      onSuccess?.()
    },
    onError: (err) => {
      setError(getErrorMessage(err, "Failed to delete product"))
    },
  })

  return {
    target,
    error,
    isPending: mutation.isPending,
    open: (product: Product) => {
      setTarget(product)
      setError(null)
    },
    close: () => {
      setTarget(null)
      setError(null)
    },
    confirm: () => {
      if (target) mutation.mutate(target.id)
    },
  }
}
