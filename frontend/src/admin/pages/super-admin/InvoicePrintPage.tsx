import {
  superAdminOrderQueryKeys,
  superAdminOrdersApi,
} from "@/admin/api/superAdminOrdersApi"
import InvoicePrintPage from "../InvoicePrintPage"

export default function SuperAdminInvoicePrintPage() {
  return (
    <InvoicePrintPage
      api={superAdminOrdersApi}
      queryKeys={superAdminOrderQueryKeys}
    />
  )
}
