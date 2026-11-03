import { useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router"
import {
  Archive,
  Banknote,
  Download,
  PackageCheck,
  Plus,
  TriangleAlert,
} from "lucide-react"
import { ApiError } from "../api/client"
import { productsApi } from "../api/productsApi"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { MetricCard } from "../components/products/MetricCard"
import { ProductCatalogFilters } from "../components/products/ProductCatalogFilters"
import { ProductCatalogTable } from "../components/products/ProductCatalogTable"
import { ProductReplenishmentNotice } from "../components/products/ProductReplenishmentNotice"
import {
  filterProducts,
  getProductMetrics,
  getProductStockStatus,
  type ProductStatusFilter,
  type ProductStockFilter,
} from "../components/products/productCatalog"
import { formatTaka } from "../lib/orderStatus"
import type { Product } from "../types/product"

const DEFAULT_PAGE_SIZE = 20
const stockFilters: ProductStockFilter[] = [
  "all",
  "in_stock",
  "low_stock",
  "out_of_stock",
]
const statusFilters: ProductStatusFilter[] = ["all", "active", "inactive"]

function getPositiveInteger(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function getStockFilter(value: string | null): ProductStockFilter {
  return stockFilters.find((filter) => filter === value) ?? "all"
}

function getStatusFilter(value: string | null): ProductStatusFilter {
  return statusFilters.find((filter) => filter === value) ?? "all"
}

function downloadCatalog(products: Product[]) {
  const headers = [
    "Name",
    "Brand",
    "Category",
    "Slug",
    "Regular price (BDT)",
    "Current price (BDT)",
    "Stock quantity",
    "Status",
    "Image",
  ]
  const rows = products.map((product) => [
    product.name,
    product.brandName,
    product.category,
    product.slug,
    product.regularPrice,
    product.currentPrice,
    product.stockQuantity,
    product.isActive ? "Active" : "Inactive",
    product.images[0] ?? "",
  ])
  const csv = [headers, ...rows]
    .map((row) =>
      row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")
    )
    .join("\r\n")
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "product-catalog.csv"
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get("q") ?? ""
  const category = searchParams.get("category") ?? "all"
  const stock = getStockFilter(searchParams.get("stock"))
  const status = getStatusFilter(searchParams.get("status"))
  const requestedPage = getPositiveInteger(searchParams.get("page"), 1)

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [noticeDismissed, setNoticeDismissed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    productsApi
      .list(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setProducts(result)
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Failed to load products. Please try again."
        )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  const metrics = useMemo(() => getProductMetrics(products), [products])
  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [products]
  )
  const selectedCategory = categories.includes(category) ? category : "all"
  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        query,
        category: selectedCategory,
        stock,
        status,
      }),
    [products, query, selectedCategory, stock, status]
  )
  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const visibleProducts = useMemo(
    () => filteredProducts.slice((page - 1) * pageSize, page * pageSize),
    [filteredProducts, page, pageSize]
  )
  const lowestStockProduct = useMemo(
    () =>
      products
        .filter(
          (product) =>
            getProductStockStatus(product.stockQuantity) === "low_stock"
        )
        .toSorted((a, b) => a.stockQuantity - b.stockQuantity)[0],
    [products]
  )

  function updateFilter(key: string, value: string) {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value === "all" || !value.trim()) next.delete(key)
        else next.set(key, value)
        next.set("page", "1")
        return next
      },
      { replace: key === "q" }
    )
  }

  function changePage(nextPage: number) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set("page", String(nextPage))
      return next
    })
  }

  function changePageSize(nextPageSize: number) {
    setPageSize(nextPageSize)
    changePage(1)
  }

  function viewLowStock() {
    setNoticeDismissed(false)
    updateFilter("stock", "low_stock")
  }

  function retryLoadingProducts() {
    setError(null)
    setLoading(true)
    setReloadKey((key) => key + 1)
  }

  const formattedStock = new Intl.NumberFormat("en-BD").format(
    metrics.availableStock
  )

  return (
    <div className="admin-dashboard-content min-w-0 space-y-3 p-4 md:p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-(--text-primary)">
              Products
            </h1>
            <span className="rounded-full bg-[#c6eee8] px-2 py-0.5 text-[10px] font-semibold text-primary">
              {metrics.activeProducts} SKUs Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Manage herbal supplement catalog, inventory counts, and pricing
            across regional channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCatalog(products)}
            disabled={loading || products.length === 0}
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="icon-size" />
            Export Catalog
          </button>
          <Link
            to="/admin/products/new"
            className="admin-template-button admin-template-button--primary h-8 px-3 text-[11px]"
          >
            <span aria-hidden="true">
              <Plus className="icon-size" />
            </span>
            Add Product
          </Link>
        </div>
      </header>

      <section
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Product catalog summary"
      >
        <MetricCard
          label="Active Products"
          value={String(metrics.activeProducts)}
          detail="Live in catalog"
          icon={Archive}
          tone="teal"
        />
        <MetricCard
          label="Available Stock"
          value={formattedStock}
          detail="Units in hub"
          icon={PackageCheck}
          tone="teal"
        />
        <MetricCard
          label="Low Stock Alert"
          value={`${metrics.lowStockCount} SKU${metrics.lowStockCount === 1 ? "" : "s"}`}
          detail="Requires replenishment"
          icon={TriangleAlert}
          tone="coral"
        />
        <MetricCard
          label="Catalog Asset Value"
          value={formatTaka(metrics.catalogAssetValue)}
          detail="Current price × stock"
          icon={Banknote}
          tone="indigo"
        />
      </section>

      <section
        className="admin-dashboard-card overflow-hidden"
        aria-label="Product catalog"
      >
        <ProductCatalogFilters
          query={query}
          category={selectedCategory}
          stock={stock}
          status={status}
          categories={categories}
          onQueryChange={(value) => updateFilter("q", value)}
          onCategoryChange={(value) => updateFilter("category", value)}
          onStockChange={(value) => updateFilter("stock", value)}
          onStatusChange={(value) => updateFilter("status", value)}
        />

        {loading ? (
          <LoadingState className="flex items-center justify-center py-14 text-sm text-(--text-muted)">
            Loading product catalog…
          </LoadingState>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={retryLoadingProducts}
            className="flex flex-col items-center gap-3 py-14 text-center"
          />
        ) : (
          <ProductCatalogTable
            products={visibleProducts}
            page={page}
            pageSize={pageSize}
            total={filteredProducts.length}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
          />
        )}
      </section>

      {lowestStockProduct && !noticeDismissed ? (
        <ProductReplenishmentNotice
          product={lowestStockProduct}
          onDismiss={() => setNoticeDismissed(true)}
          onViewLowStock={viewLowStock}
        />
      ) : null}
    </div>
  )
}
