import { useNavigate } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import { productsApi } from "../api/productsApi"
import type { ProductFormValues } from "../schemas/productSchema"

export function ProductCreatePage() {
  const navigate = useNavigate()

  const submitProduct = async (values: ProductFormValues) => {
    await productsApi.create({
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
