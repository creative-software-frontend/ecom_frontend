import { useNavigate } from "react-router"
import { ProductForm } from "../components/products/ProductForm"
import type { ProductFormValues } from "../schemas/productSchema"

export default function ProductCreatePage() {
  const navigate = useNavigate()

  const onSubmit = async (values: ProductFormValues) => {
    console.log("Create Product Payload:", values)
    // TODO: API call later
    // await productsApi.create(...)
    navigate("/shop/products")
  }

  return (
    <ProductForm
      mode="create"
      submitLabel="Create Product"
      onSubmit={onSubmit}
      onCancel={() => navigate("/shop/products")}
    />
  )
}
