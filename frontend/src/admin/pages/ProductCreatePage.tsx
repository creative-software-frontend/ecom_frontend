import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import { InlineNotice } from "../components/common/InlineNotice"
import {
  describeShopProductError,
  productQueryKeys,
  productsApi,
} from "../api/productsApi"
import { SIDEBAR_STATS_QUERY_KEY } from "../hooks/useSidebarStats"
import type { ProductFormValues } from "../schemas/productSchema"

export default function ProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) => productsApi.create(values),
  })

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitError(null)
    try {
      await createMutation.mutateAsync(values)
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
      navigate("/shop/products")
    } catch (error) {
      setSubmitError(
        describeShopProductError(error, "Failed to create product")
      )
    }
  }

  return (
    <div>
      {submitError && (
        <InlineNotice
          message={submitError}
          variant="error"
          ariaLive="assertive"
          dismissLabel="Dismiss error"
          onDismiss={() => setSubmitError(null)}
          className="flex items-center justify-between gap-3 border-b border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-6 py-2.5 text-sm text-(--status-cancelled-text)"
          dismissClassName="text-xs font-medium hover:underline"
        />
      )}
      <ProductForm
        mode="create"
        // Empty specification list avoids the form's default blank row failing
        // the required key/value validation before the API is reached.
        initialValues={{ specifications: [] }}
        submitLabel="Create Product"
        isSubmitting={createMutation.isPending}
        onSubmit={onSubmit}
        onCancel={() => navigate("/shop/products")}
      />
    </div>
  )
}
