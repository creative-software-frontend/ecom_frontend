import { memo, useCallback, useMemo, useRef, useState } from "react"
import { Link, useLocation } from "react-router"
import { Pencil, Trash2 } from "lucide-react"
import DataTable, { Column } from "datatables.net-react"
import DataTablesCore from "datatables.net-dt"
import "datatables.net-dt/css"
import { productsApi } from "../api/productsApi"
import { ConfirmDialog } from "../components/ConfirmDialog"
import { EmptyState } from "../components/common/EmptyState"
import { ErrorState } from "../components/common/ErrorState"
import { InlineNotice } from "../components/common/InlineNotice"
import { LoadingState } from "../components/common/LoadingState"
import { SearchInput } from "../components/common/SearchInput"
import { StatusBadge } from "../components/common/StatusBadge"
import { useApiQuery } from "../hooks/useApiQuery"
import type { Product, ProductWriteInput } from "../types/product"

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

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Could not load products. Please try again."
}

function getEditableProductValues(
  product: Product,
  isActive = product.isActive
): ProductWriteInput {
  return {
    name: product.name,
    brandName: product.brandName,
    category: product.category,
    slug: product.slug,
    regularPrice: product.regularPrice,
    currentPrice: product.currentPrice,
    stockQuantity: product.stockQuantity,
    images: product.images,
    isActive,
  }
}

function getProductImage(product: Product): string | undefined {
  const firstImage = product.images[0]
  return typeof firstImage === "string" ? firstImage : undefined
}

function getStockStatus(product: Product): {
  label: string
  variant: "in-stock" | "low-stock" | "out-of-stock"
} {
  if (!product.inStock || product.stockQuantity === 0) {
    return { label: "Out of stock", variant: "out-of-stock" }
  }
  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) {
    return { label: "Low stock", variant: "low-stock" }
  }
  return { label: "In stock", variant: "in-stock" }
}

const tableOptions = {
  autoWidth: false,
  columnDefs: [{ targets: [0, 7], orderable: false, searchable: false }],
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
            <div className="min-w-45">
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
          return <StatusBadge variant={status.variant} label={status.label} />
        }}
      </Column>
      <Column title="Status" data="isActive">
        {(_data: unknown, type: string, product: Product) =>
          type === "display" ? (
            <StatusBadge
              variant={product.isActive ? "active" : "inactive"}
              label={product.isActive ? "Active" : "Inactive"}
            />
          ) : (
            Number(product.isActive)
          )
        }
      </Column>
      <Column title="Created date" data="createdAt">
        {(_data: unknown, type: string, product: Product) =>
          type === "display"
            ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                new Date(product.createdAt)
              )
            : new Date(product.createdAt).getTime()
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
  const listDeps = useMemo(() => [], [])
  const fetchProducts = useCallback(
    (signal: AbortSignal) => productsApi.list(signal),
    []
  )
  const {
    data: loadedProducts,
    error: loadError,
    isLoading,
    reload,
  } = useApiQuery(fetchProducts, listDeps)
  const [productsOverride, setProductsOverride] = useState<Product[] | null>(
    null
  )
  const products = productsOverride ?? loadedProducts
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleteStatus, setDeleteStatus] = useState<string | null>(() =>
    getNavigationStatus(location.state)
  )
  const deleteTriggerRef = useRef<HTMLButtonElement | null>(null)
  const deleteStatusRef = useRef<HTMLDivElement | null>(null)

  const filteredProducts = useMemo(() => {
    return (products ?? []).filter((product) =>
      product.name
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase())
    )
  }, [products, search])

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
    await productsApi.remove(product.id)
    setProductsOverride(
      (productsOverride ?? loadedProducts ?? []).filter(
        (item) => item.id !== product.id
      )
    )
    setDeleteStatus(`${product.name} was deleted`)
    setProductToDelete(null)
  }

  const handleDeactivate = async () => {
    if (!productToDelete) return

    const product = productToDelete
    const updatedProduct = await productsApi.update(
      product.id,
      getEditableProductValues(product, false)
    )
    setProductsOverride(
      (productsOverride ?? loadedProducts ?? []).map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item
      )
    )
    setDeleteStatus(`${product.name} was deactivated`)
    setProductToDelete(null)
  }

  return (
    <div className="min-w-0 p-4 admin-dashboard-content md:p-7.5">
      <header className="admin-page-title flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">Products</h1>
          <p className="pt-0.75 text-base text-gray-500">
            Manage your product catalog
          </p>
        </div>
        <Link
          to="/admin/products/new"
          className="admin-template-button self-start admin-template-button--primary sm:self-auto"
        >
          Add product
        </Link>
      </header>

      {deleteStatus ? (
        <InlineNotice
          rootRef={deleteStatusRef}
          className="admin-product-status"
          tabIndex={-1}
          message={deleteStatus}
          variant="success"
          dismissLabel="Dismiss status message"
          dismissText="×"
          dismissClassName="admin-product-status-dismiss"
          onDismiss={() => setDeleteStatus(null)}
        />
      ) : null}

      {isLoading ? (
        <LoadingState
          className="admin-dashboard-card bg-white p-6 text-sm text-gray-600"
        >
          Loading products...
        </LoadingState>
      ) : null}

      {loadError ? (
        <ErrorState
          className="space-y-4 admin-dashboard-card bg-white p-6"
          role="alert"
          message={getErrorMessage(loadError)}
          messageClassName="text-sm text-red-700"
          buttonClassName="admin-template-button admin-template-button--primary"
          onRetry={reload}
        />
      ) : null}

      {!isLoading && !loadError && products?.length === 0 ? (
        <EmptyState
          className="admin-dashboard-card bg-white p-6"
          title="No products yet"
          titleClassName="mb-4 text-sm text-gray-600"
          action={
            <Link
            to="/admin/products/new"
            className="admin-template-button admin-template-button--primary"
          >
            Add product
          </Link>
          }
        />
      ) : null}

      {!isLoading && !loadError && products && products.length > 0 ? (
        <section
          className="min-w-0 overflow-hidden admin-dashboard-card bg-white"
          aria-labelledby="products-table-title"
        >
          <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h2
              id="products-table-title"
              className="text-sm font-bold text-gray-700"
            >
              All products
            </h2>
            <SearchInput
              label="Search by name"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              labelClassName="flex w-full max-w-sm items-center gap-2 text-sm text-gray-600"
              inputClassName="min-w-0 flex-1 rounded border admin-products-search px-3 py-2 text-sm"
            />
          </div>

          <div className="admin-products-table-wrap">
            <ProductTable
              products={filteredProducts}
              onDelete={openDeleteDialog}
            />
          </div>
        </section>
      ) : null}
      <ConfirmDialog
        key={productToDelete?.id ?? "closed"}
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
        onDeactivate={handleDeactivate}
      />
    </div>
  )
}

export default ProductsPage
