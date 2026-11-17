import { useNavigate, useParams } from "react-router"
import { Ban, ArrowLeft } from "lucide-react"
import { ProductForm } from "../../components/products/ProductForm"
import {
  MOCK_SHOPS,
  MOCK_SUPER_ADMIN_PRODUCTS,
} from "../../data/superAdminProductsMock"
import type { ProductFormValues } from "../../schemas/productSchema"
import { NotFoundState } from "../../components/common/NotFoundState"

export default function SuperAdminProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const productId = Number(id)
  const product = MOCK_SUPER_ADMIN_PRODUCTS.find((p) => p.id === productId)

  // 1. Not found
  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-app) p-6">
        <NotFoundState
          title="Product not found"
          description="This product may have been deleted or the link is invalid."
          backTo="/admin/products"
          backLabel="Back to products"
          className="flex flex-col items-center gap-3 text-center"
          titleClassName="text-lg font-semibold text-(--text-primary)"
          descriptionClassName="text-sm text-(--text-muted)"
          linkClassName="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  // 2. Blocked product — cannot edit
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
            was blocked by a super admin. Blocked products cannot be edited or
            deleted until they are unblocked.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
            >
              <ArrowLeft className="size-4" />
              Back to Products
            </button>
          </div>
          <p className="mt-4 text-[11px] text-(--text-muted)">
            Tip: Go to{" "}
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              className="font-medium text-(--primary) hover:underline"
            >
              /admin/products
            </button>{" "}
            and use the 3-dot menu → Unblock first.
          </p>
        </div>
      </div>
    )
  }

  // 3. Normal edit
  const initialValues: Partial<ProductFormValues> = {
    name: product.name,
    brand: product.brandName,
    category: product.category,
    sellingPrice: product.currentPrice,
    regularPrice: product.regularPrice,
    stock: product.stockQuantity,
    inStock: product.stockQuantity > 0,
    isPublic: product.isActive,
    images: product.images.length > 0 ? product.images : [""],
    shopId: product.shopId,
  }

  const onSubmit = async (values: ProductFormValues) => {
    // Mock save — backend integration later
    console.log("Update Product Payload:", values)
    navigate("/admin/products")
  }

  return (
    <ProductForm
      mode="edit"
      variant="super"
      shops={MOCK_SHOPS}
      shopSelectorLocked
      initialValues={initialValues}
      submitLabel="Save Changes"
      onSubmit={onSubmit}
      onCancel={() => navigate("/admin/products")}
    />
  )
}
