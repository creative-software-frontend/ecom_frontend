import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { ProductForm } from "../../components/products/ProductForm"
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { LoadingState } from "../../components/common/LoadingState"
import { superAdminApi } from "../../api/superAdminApi"
import {
  describeSuperAdminProductError,
  superAdminProductQueryKeys,
  superAdminProductsApi,
} from "../../api/superAdminProductsApi"
import type { ProductFormValues } from "../../schemas/productSchema"

export default function SuperAdminProductCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const shopsQuery = useQuery({
    queryKey: ["admin", "super", "shops", "product-form-options"],
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
    staleTime: 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      superAdminProductsApi.create(values),
  })

  const shops = useMemo(
    () =>
      (shopsQuery.data ?? []).map((shop) => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
      })),
    [shopsQuery.data]
  )

  if (shopsQuery.isPending) {
    return (
      <LoadingState className="p-8 text-center text-sm text-(--text-muted)">
        Loading shops...
      </LoadingState>
    )
  }

  if (shopsQuery.isError) {
    return (
      <div className="p-8">
        <ErrorState
          message={describeSuperAdminProductError(
            shopsQuery.error,
            "Failed to load shops"
          )}
          onRetry={() => void shopsQuery.refetch()}
          className="flex flex-col items-center gap-3 rounded-md border border-(--border-light) bg-(--bg-surface) py-16 text-center"
          messageClassName="text-sm font-medium text-(--text-muted)"
          buttonClassName="inline-flex h-9 items-center rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitError(null)
    try {
      await createMutation.mutateAsync(values)
      void queryClient.invalidateQueries({
        queryKey: superAdminProductQueryKeys.all,
      })
      void queryClient.invalidateQueries({
        queryKey: ["admin", "sidebar-stats"],
      })
      navigate("/admin/products")
    } catch (error) {
      setSubmitError(
        describeSuperAdminProductError(error, "Failed to create product")
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
        variant="super"
        shops={shops}
        // Empty specification list avoids the form's default blank row failing
        // the required key/value validation before the API is reached.
        initialValues={{ specifications: [] }}
        submitLabel="Create Product"
        isSubmitting={createMutation.isPending}
        onSubmit={onSubmit}
        onCancel={() => navigate("/admin/products")}
      />
    </div>
  )
}
