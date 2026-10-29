import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
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
    <div
      className="admin-dashboard-content min-w-0 p-4 md:p-[30px]"
      role="status"
      aria-label="Loading product"
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
    </div>
  )
}

type ProductLoadState =
  | { requestKey: string; product: Product }
  | { requestKey: string; error: unknown }

export function ProductEditPage() {
  const { id = "" } = useParams()
  const navigate = useNavigate()
  const [loadState, setLoadState] = useState<ProductLoadState | null>(null)
  const [attempt, setAttempt] = useState(0)
  const requestKey = `${id}:${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    productsApi.get(id, controller.signal).then(
      (loadedProduct) => {
        if (active) setLoadState({ requestKey, product: loadedProduct })
      },
      (loadError: unknown) => {
        if (active) setLoadState({ requestKey, error: loadError })
      }
    )

    return () => {
      active = false
      controller.abort()
    }
  }, [id, requestKey])

  if (!loadState || loadState.requestKey !== requestKey) {
    return <ProductEditSkeleton />
  }

  if ("error" in loadState && isNotFoundError(loadState.error)) {
    return (
      <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
        <header className="admin-page-title">
          <h1 className="text-xl font-normal text-gray-800">
            Product not found
          </h1>
          <p className="pt-[3px] text-base text-gray-500">
            The product may have been removed or the link is incorrect.
          </p>
        </header>
        <Link
          to="/admin/products"
          className="admin-template-button admin-template-button--secondary"
        >
          Back to products
        </Link>
      </div>
    )
  }

  if ("error" in loadState) {
    return (
      <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
        <header className="admin-page-title">
          <h1 className="text-xl font-normal text-gray-800">
            Could not load product
          </h1>
          <p className="pt-[3px] text-base text-gray-500">
            {getErrorMessage(loadState.error)}
          </p>
        </header>
        <button
          type="button"
          className="admin-template-button admin-template-button--primary"
          onClick={() => setAttempt((currentAttempt) => currentAttempt + 1)}
        >
          Retry
        </button>
      </div>
    )
  }

  const product = loadState.product

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
