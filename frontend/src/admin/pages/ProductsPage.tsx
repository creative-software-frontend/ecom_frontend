import { memo, useCallback, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router"
import { Pencil, Trash2 } from "lucide-react"
import DataTable, { Column } from "datatables.net-react"
import DataTablesCore from "datatables.net-dt"
import "datatables.net-dt/css"
import { products as initialProducts } from "../data/products"
import { deleteProduct } from "../data/mockProductsApi"
import { ConfirmDialog } from "../components/ConfirmDialog"
import type { Product } from "../types/product"

const setDataTablesCore = DataTable.use
setDataTablesCore(DataTablesCore)

const LOW_STOCK_THRESHOLD = 5

function getNavigationStatus(state: unknown): string | null {
  if (
    typeof state === "object" &&
    state !== null &&
    "productStatus" in state &&
    typeof state.productStatus === "string"
  ) {
    return state.productStatus
  }
  return null
}

function formatPrice(price: number): string {
  return `৳ ${new Intl.NumberFormat("en-BD").format(price)}`
}

function getProductImage(product: Product): string | undefined {
  const firstImage = Array.isArray(product.images)
    ? product.images[0]
    : undefined
  return typeof firstImage === "string" ? firstImage : undefined
}

function getStockStatus(product: Product): {
  label: string
  className: string
} {
  if (!product.inStock || product.stockQuantity === 0) {
    return { label: "Out of stock", className: "admin-product-stock--out" }
  }
  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) {
    return { label: "Low stock", className: "admin-product-stock--low" }
  }
  return { label: "In stock", className: "admin-product-stock--in" }
}

const tableOptions = {
  autoWidth: false,
  columnDefs: [{ targets: [0, 6], orderable: false, searchable: false }],
  info: true,
  language: {
    emptyTable: "No products found",
    info: "Showing _START_ to _END_ of _TOTAL_ products",
    infoEmpty: "Showing 0 to 0 of 0 products",
    zeroRecords: "No products found",
  },
  lengthChange: false,
  order: [[1, "asc"]] as [[number, "asc"]],
  pageLength: 10,
  paging: true,
  searching: false,
}

type ProductTableProps = {
  products: Product[]
  onDelete: (product: Product, trigger: HTMLButtonElement) => void
}

const ProductTable = memo(function ProductTable({
  products,
  onDelete,
}: ProductTableProps) {
  return (
    <DataTable
      data={products}
      className="admin-products-table"
      options={tableOptions}
    >
      <Column title="Image" data="images">
        {(_data: unknown, _type: string, product: Product) => {
          const image = getProductImage(product)
          return image ? (
            <img
              className="admin-product-thumbnail"
              src={image}
              alt=""
              loading="lazy"
            />
          ) : (
            <span
              className="admin-product-thumbnail-fallback"
              aria-hidden="true"
            >
              —
            </span>
          )
        }}
      </Column>
      <Column title="Name" data="name">
        {(_data: unknown, type: string, product: Product) =>
          type === "display" ? (
            <div className="min-w-[180px]">
              <div className="font-medium">{product.name}</div>
              <div className="text-xs text-gray-500">{product.brandName}</div>
            </div>
          ) : (
            product.name
          )
        }
      </Column>
      <Column title="Category" data="category" />
      <Column title="Current price" data="currentPrice">
        {(_data: unknown, type: string, product: Product) =>
          type === "display"
            ? formatPrice(product.currentPrice)
            : product.currentPrice
        }
      </Column>
      <Column title="Stock" data="stockQuantity">
        {(_data: unknown, type: string, product: Product) => {
          if (type !== "display") {
            return product.stockQuantity
          }
          const status = getStockStatus(product)
          return (
            <span className={`admin-product-stock ${status.className}`}>
              {status.label}
            </span>
          )
        }}
      </Column>
      <Column title="Created date" data="createdAt">
        {(_data: unknown, type: string, product: Product) =>
          type === "display"
            ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                product.createdAt
              )
            : product.createdAt.getTime()
        }
      </Column>
      <Column
        title="Actions"
        data={null}
        options={{ orderable: false, searchable: false }}
      >
        {(_data: unknown, _type: string, product: Product) => (
          <div className="admin-product-actions">
            <Link
              to={`/admin/products/${product.id}/edit`}
              className="admin-product-edit-link"
              aria-label={`Edit ${product.name}`}
            >
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="admin-product-delete-button"
              aria-label={`Delete ${product.name}`}
              onClick={(event) => onDelete(product, event.currentTarget)}
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        )}
      </Column>
    </DataTable>
  )
})

export function ProductsPage() {
  const location = useLocation()
  const [search, setSearch] = useState("")
  const [products, setProducts] = useState(initialProducts)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<string | null>(() =>
    getNavigationStatus(location.state)
  )
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const deleteStatusRef = useRef<HTMLDivElement | null>(null)
  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase())
      ),
    [products, search]
  )

  const openDeleteDialog = useCallback(
    (product: Product, trigger: HTMLButtonElement) => {
      deleteTriggerRef.current = trigger
      setDeleteStatus(null)
      setProductToDelete(product)
    },
    []
  )

  const handleDelete = async () => {
    if (!productToDelete) return

    const product = productToDelete
    await deleteProduct(product.id)
    setProducts((currentProducts) =>
      currentProducts.filter((item) => item.id !== product.id)
    )
    setDeleteStatus(`${product.name} was deleted`)
    setProductToDelete(null)
  }

  return (
    <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
      <header className="admin-page-title flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Products</h1>
          <p className="pt-[3px] text-base text-gray-500">
            Manage your product catalog
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="admin-template-button admin-template-button--primary self-start sm:self-auto"
        >
          Add product
        </Link>
      </header>

      {deleteStatus ? (
        <div
          ref={deleteStatusRef}
          className="admin-product-status"
          role="status"
          tabIndex={-1}
        >
          <span>{deleteStatus}</span>
          <button
            type="button"
            className="admin-product-status-dismiss"
            aria-label="Dismiss status message"
            onClick={() => setDeleteStatus(null)}
          >
            ×
          </button>
        </div>
      ) : null}

      <section
        className="admin-dashboard-card min-w-0 overflow-hidden bg-white"
        aria-labelledby="products-table-title"
      >
        <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <h2
            id="products-table-title"
            className="text-sm font-bold text-gray-700"
          >
            All products
          </h2>
          <label className="flex w-full max-w-sm items-center gap-2 text-sm text-gray-600">
            <span className="shrink-0">Search by name</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Search products..."
              className="admin-products-search min-w-0 flex-1 rounded border px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="admin-products-table-wrap">
          <ProductTable
            products={filteredProducts}
            onDelete={openDeleteDialog}
          />
        </div>
      </section>
      <ConfirmDialog
        open={productToDelete !== null}
        productName={productToDelete?.name ?? ""}
        onCancel={() => {
          setProductToDelete(null)
          requestAnimationFrame(() => {
            if (deleteTriggerRef.current?.isConnected) {
              deleteTriggerRef.current.focus()
            } else {
              deleteStatusRef.current?.focus()
            }
          })
        }}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default ProductsPage
