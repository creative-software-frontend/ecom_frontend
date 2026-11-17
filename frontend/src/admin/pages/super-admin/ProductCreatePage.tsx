import { useNavigate } from "react-router"
import { ProductForm } from "../../components/products/ProductForm"
import { MOCK_SHOPS } from "../../data/superAdminProductsMock"
import type { ProductFormValues } from "../../schemas/productSchema"

export default function SuperAdminProductCreatePage() {
  const navigate = useNavigate()

  const onSubmit = async (values: ProductFormValues) => {
    // Mock save — backend integration later
    console.log("Create Product Payload:", values)
    navigate("/admin/products")
  }

  return (
    <ProductForm
      mode="create"
      variant="super"
      shops={MOCK_SHOPS}
      submitLabel="Create Product"
      onSubmit={onSubmit}
      onCancel={() => navigate("/admin/products")}
    />
  )
}
