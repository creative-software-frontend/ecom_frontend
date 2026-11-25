import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router"
import { ArrowLeft, Ban } from "lucide-react"
import { ApiError } from "../api/client"
import {
  describeShopProductError,
  productQueryKeys,
  productsApi,
} from "../api/productsApi"
import { ErrorState } from "../components/common/ErrorState"
import { InlineNotice } from "../components/common/InlineNotice"
import { LoadingState } from "../components/common/LoadingState"
import { NotFoundState } from "../components/common/NotFoundState"
import { ProductForm } from "../components/products/ProductForm"
import { SIDEBAR_STATS_QUERY_KEY } from "../hooks/useSidebarStats"
import type { ProductFormValues } from "../schemas/productSchema"
import type { Product } from "../types/product"

function toInitialValues(product: Product): Partial<ProductFormValues> {
  return {
    name: product.name,
    sku: product.sku ?? undefined,
    badge: product.badge ?? undefined,
    brand: product.brandName,
    category: product.category,
    subcategory: product.subcategory ?? undefined,
    section: product.section ?? undefined,
    shortDescription: product.shortDescription ?? undefined,
    description: product.description ?? undefined,
    sellingPrice: product.currentPrice,
    regularPrice: product.regularPrice,
    buyingPrice: product.buyingPrice ?? undefined,
    stock: product.stockQuantity,
    inStock: product.inStock,
    isPublic: product.isActive,
    isFeatured: product.isFeatured ?? false,
    isFreeShipping: product.isFreeShipping ?? false,
    productType: product.productType === "variant" ? "variant" : "single",
    enableStockAlert: product.enableStockAlert ?? false,
    stockAlertQty: product.stockAlertQty ?? undefined,
    maxOrderQty: product.maxOrderQty ?? undefined,
    rank: product.rank ?? undefined,
    images: product.images?.length ? product.images : [""],
    specifications: product.specifications?.length
      ? product.specifications.map((row) => ({
          key: row.key,
          value: row.value,
        }))
      : [],
    metaTitle: product.seo?.metaTitle ?? undefined,
    metaDescription: product.seo?.metaDescription ?? undefined,
    keywords: product.seo?.keywords ?? undefined,
    sizeOptions: Array.isArray(product.sizeOptions) ? product.sizeOptions : [],
    colorOptions: Array.isArray(product.colorOptions)
      ? product.colorOptions
      : [],
    variants: (product.variants ?? []).map((variant) => ({
      id: String(variant.id ?? `${variant.size ?? ""}-${variant.color ?? ""}`),
      size: variant.size ?? "",
      color: variant.color ?? "",
      sku: variant.sku ?? "",
      price: variant.price,
      stock: variant.stock,
    })),
    shopId: product.shopId,
  }
}

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const productId = id ?? ""

  const productQuery = useQuery({
    queryKey: productQueryKeys.detail(productId),
    queryFn: ({ signal }) => productsApi.get(productId, signal),
    enabled: productId !== "",
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        return false
      }
      return failureCount < 3
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: ProductFormValues) =>
      productsApi.update(productId, values),
  })

  if (productQuery.isPending) {
    return (
      <LoadingState className="p-8 text-center text-sm text-(--text-muted)">
        Loading product...
      </LoadingState>
    )
  }

  const productError = productQuery.error
  if (productError) {
    if (productError instanceof ApiError && productError.status === 404) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-(--bg-app) p-6">
          <NotFoundState
            title="Product not found"
            description="This product may have been deleted or the link is invalid."
            backTo="/shop/products"
            backLabel="Back to products"
            className="flex flex-col items-center gap-3 text-center"
            titleClassName="text-lg font-semibold text-(--text-primary)"
            descriptionClassName="text-sm text-(--text-muted)"
            linkClassName="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
          />
        </div>
      )
    }
    return (
      <div className="p-8">
        <ErrorState
          message={describeShopProductError(
            productError,
            "Failed to load product"
          )}
          onRetry={() => {
            void productQuery.refetch()
          }}
          className="flex flex-col items-center gap-3 rounded-md border border-(--border-light) bg-(--bg-surface) py-16 text-center"
          messageClassName="text-sm font-medium text-(--text-muted)"
          buttonClassName="inline-flex h-9 items-center rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  const product = productQuery.data
  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-app) p-6">
        <NotFoundState
          title="Product not found"
          description="This product may have been deleted or the link is invalid."
          backTo="/shop/products"
          backLabel="Back to products"
          className="flex flex-col items-center gap-3 text-center"
          titleClassName="text-lg font-semibold text-(--text-primary)"
          descriptionClassName="text-sm text-(--text-muted)"
          linkClassName="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  // Blocked product — a platform administrator must unblock it first.
  if (product.isBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-app) p-6">
        <div className="w-full max-w-lg rounded-lg border border-(--border-light) bg-(--bg-surface) p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-(--status-cancelled-bg) text-(--status-cancelled-text)">
            <Ban className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-semibold text-(--text-primary)">
            Product is blocked
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            <strong className="font-semibold text-(--text-primary)">
              {product.name}
            </strong>{" "}
            was blocked by a platform administrator and cannot be edited until
            it is unblocked.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/shop/products")}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
            >
              <ArrowLeft className="size-4" />
              Back to Products
            </button>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitError(null)
    try {
      await updateMutation.mutateAsync(values)
      void queryClient.invalidateQueries({ queryKey: productQueryKeys.all })
      void queryClient.invalidateQueries({
        queryKey: productQueryKeys.detail(productId),
      })
      void queryClient.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY })
      navigate("/shop/products")
    } catch (error) {
      setSubmitError(
        describeShopProductError(error, "Failed to update product")
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
        mode="edit"
        initialValues={toInitialValues(product)}
        submitLabel="Save Changes"
        isSubmitting={updateMutation.isPending}
        onSubmit={onSubmit}
        onCancel={() => navigate("/shop/products")}
      />
    </div>
  )
}
