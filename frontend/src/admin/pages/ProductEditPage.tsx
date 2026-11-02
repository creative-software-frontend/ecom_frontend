import { useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { NotFoundState } from "../components/common/NotFoundState"
import { useApiQuery } from "../hooks/useApiQuery"
import { ApiError } from "../api/client"
import { productsApi } from "../api/productsApi"
import type { Product } from "../types/product"
import type {
  ProductFormInitialValues,
  ProductFormValues,
} from "../schemas/productSchema"

function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Could not load this product. Please try again."
}

function toFormValues(product: Product): ProductFormInitialValues {
  return {
    id: product.id,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    name: product.name,
    brandName: product.brandName,
    category: product.category,
    slug: product.slug,
    regularPrice: product.regularPrice,
    currentPrice: product.currentPrice,
    stockQuantity: product.stockQuantity,
    isActive: product.isActive,
    images: product.images.map((src) => ({ src })),
  }
}

function ProductEditSkeleton() {
  return (
    <LoadingState
      className="admin-dashboard-content min-w-0 p-4 md:p-[30px]"
      ariaLabel="Loading product"
    >
      <header className="admin-page-title">
        <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-200" />
      </header>
      <div className="space-y-6">
        {[0, 1, 2].map((section) => (
          <section
            key={section}
            className="admin-dashboard-card overflow-hidden bg-white"
          >
            <div className="admin-form-card-header">
              <div className="h-5 w-28 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="grid gap-5 p-4 md:grid-cols-2 md:p-6">
              {[0, 1].map((field) => (
                <div
                  key={field}
                  className="h-16 animate-pulse rounded bg-gray-100"
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </LoadingState>
  )
}

export function ProductEditPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const queryDeps = useMemo(() => [id], [id])
  const fetchProduct = useCallback(
    (signal: AbortSignal) => productsApi.get(id, signal),
    [id]
  )
  const { data: product, error, isLoading, reload } = useApiQuery(
    fetchProduct,
    queryDeps
  )

  if (isLoading) {
    return <ProductEditSkeleton />
  }

  if (error && isNotFoundError(error)) {
    return (
      <NotFoundState
        title="Product not found"
        description="The product may have been removed or the link is incorrect."
        backTo="/admin/products"
        backLabel="Back to products"
        className="admin-dashboard-content min-w-0 p-4 md:p-[30px]"
        titleElement="h1"
        titleContainerClassName="admin-page-title"
        titleClassName="text-xl font-normal text-gray-800"
        descriptionClassName="pt-[3px] text-base text-gray-500"
        linkClassName="admin-template-button admin-template-button--secondary"
      />
    )
  }

  if (error) {
    return (
      <ErrorState
        message={
          <header className="admin-page-title">
            <h1 className="text-xl font-normal text-gray-800">
              Could not load product
            </h1>
            <p className="pt-[3px] text-base text-gray-500">
              {getErrorMessage(error)}
            </p>
          </header>
        }
        wrapMessage={false}
        className="admin-dashboard-content min-w-0 p-4 md:p-[30px]"
        buttonClassName="admin-template-button admin-template-button--primary"
        onRetry={reload}
      />
    )
  }

  if (!product) return <ProductEditSkeleton />

  const submitProduct = async (values: ProductFormValues) => {
    await productsApi.update(product.id, {
      name: values.name,
      brandName: values.brandName,
      category: values.category,
      slug: values.slug,
      regularPrice: values.regularPrice,
      currentPrice: values.currentPrice,
      stockQuantity: values.stockQuantity,
      images: values.images.map((image) => image.src),
      isActive: values.isActive,
    })
    navigate("/admin/products", {
      state: { productStatus: `${values.name} was updated` },
    })
  }

  return (
    <ProductForm
      initialValues={toFormValues(product)}
      mode="edit"
      submitLabel="Save changes"
      onSubmit={submitProduct}
      onCancel={() => navigate("/admin/products")}
    />
  )
}

export default ProductEditPage
