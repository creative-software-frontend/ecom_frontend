import { useNavigate } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import { mockSubmitProduct } from "../data/mockProductsApi"
import type { ProductCreateInput } from "../types/product"
import type { ProductFormValues } from "../schemas/productSchema"

export function ProductCreatePage() {
  const navigate = useNavigate()

  const submitProduct = async (values: ProductFormValues) => {
    const regularPrice = values.regularPrice
    const currentPrice = values.currentPrice
    const product: ProductCreateInput = {
      name: values.name,
      brandName: values.brandName,
      category: values.category,
      slug: values.slug,
      regularPrice,
      currentPrice,
      discountPercent: Math.round(
        ((regularPrice - currentPrice) / regularPrice) * 100
      ),
      stockQuantity: values.stockQuantity,
      inStock: values.stockQuantity > 0,
      images: values.images.map((image) => image.src),
    }

    await mockSubmitProduct(product)
    navigate("/admin/products", {
      state: { productStatus: `${values.name} was created` },
    })
  }

  return (
    <ProductForm
      mode="create"
      submitLabel="Add product"
      onSubmit={submitProduct}
      onCancel={() => navigate("/admin/products")}
    />
  )
}

export default ProductCreatePage
