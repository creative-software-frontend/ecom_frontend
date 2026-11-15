import { useCallback, useMemo } from "react"
import { useNavigate, useParams } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import { LoadingState } from "../components/common/LoadingState"
import { useApiQuery } from "../hooks/useApiQuery"
import { productsApi } from "../api/productsApi"
import type { ProductFormValues } from "../schemas/productSchema"

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const fetchProduct = useCallback(
    (signal: AbortSignal) => productsApi.get(id!, signal),
    [id]
  )
  const deps = useMemo(() => [id], [id])
  const { data: product, isLoading } = useApiQuery(fetchProduct, deps)

  if (isLoading) {
    return <LoadingState>Loading product...</LoadingState>
  }
  if (!product) {
    return (
      <div className="p-8 text-center text-sm text-(--text-muted)">
        Product not found.
      </div>
    )
  }

  const onSubmit = async (values: ProductFormValues) => {
    // TODO: wire to API later
    console.log("Update Product Payload:", values)
    navigate("/shop/products")
  }

  return (
    <ProductForm
      mode="edit"
      submitLabel="Save Changes"
      onSubmit={onSubmit}
      onCancel={() => navigate("/shop/products")}
      initialValues={{
        // Direct matches
        name: product.name,
        category: product.category,
        regularPrice: product.regularPrice,
        inStock: product.inStock,

        // Renamed fields (DB name → Form name)
        brand: product.brandName,
        sellingPrice: product.currentPrice,
        stock: product.stockQuantity,
        isPublic: product.isActive,

        // Images — empty হলে form-এ একটা empty input দরকার
        images: product.images?.length ? product.images : [""],
      }}
    />
  )
}
