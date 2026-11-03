import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import DataTable, { type TableColumn } from "react-data-table-component"
import { EmptyState } from "../components/common/EmptyState"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { SearchInput } from "../components/common/SearchInput"
import { StatusBadge } from "../components/common/StatusBadge"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { formatTaka } from "../lib/orderStatus"
import { Download } from "lucide-react"

// Types for Product Catalog
export type ProductItem = {
  id: string
  name: string
  subtitle: string
  sku: string
  category: string
  price: number
  originalPrice?: number
  discountPercent?: number
  stockCount: number
  stockStatus: "in_stock" | "low_stock" | "out_of_stock"
  status: "active" | "draft" | "archived"
  imageUrl?: string
}

export type ProductsResponse = {
  items: ProductItem[]
  total: number
  metrics: {
    activeProducts: number
    availableStock: number
    lowStockCount: number
    catalogAssetValue: number
  }
  replenishmentAlert?: {
    productName: string
    sku: string
    stockLeft: number
    daysLeft: number
  }
}

const PAGE_LIMIT = 20

// Table custom styles matching admin.css and DESIGN.md
const tableCustomStyles = {
  table: {
    style: {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-primary)",
    },
  },
  headRow: {
    style: {
      backgroundColor: "var(--bg-table-header)",
      borderBottom: "1px solid var(--border-light)",
      minHeight: "36px",
    },
  },
  headCells: {
    style: {
      color: "var(--text-muted)",
      fontSize: "12px",
      fontWeight: "600",
      textTransform: "uppercase" as const,
      paddingLeft: "16px",
      paddingRight: "16px",
    },
  },
  rows: {
    style: {
      minHeight: "56px",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-light)",
      "&:hover": {
        backgroundColor: "var(--bg-surface-hover)",
        transition: "background-color 0.15s ease",
      },
    },
  },
  cells: {
    style: {
      paddingLeft: "16px",
      paddingRight: "16px",
      color: "var(--text-primary)",
      fontSize: "13px",
    },
  },
  pagination: {
    style: {
      borderTop: "1px solid var(--border-light)",
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-muted)",
      fontSize: "13px",
      minHeight: "52px",
    },
  },
}

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get("q") ?? ""
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1)

  const [inputValue, setInputValue] = useState(q)
  const [searchSequence, setSearchSequence] = useState(0)
  const searchValue = useMemo(
    () => ({ value: inputValue, sequence: searchSequence }),
    [inputValue, searchSequence]
  )
  const debouncedSearch = useDebouncedValue(searchValue, 300)
  const searchScheduledRef = useRef(false)

  const [hasLoaded, setHasLoaded] = useState(false)
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  // Mock API call fetcher (Replace with actual productsApi.list in your project)
  const doFetch = useCallback((_signal: AbortSignal, id: number) => {
    setLoading(true)
    setError(null)

    // Simulating production API response matching screen_2.jpg
    setTimeout(() => {
      if (id !== requestIdRef.current) return
      setData({
        total: 3,
        metrics: {
          activeProducts: 3,
          availableStock: 864,
          lowStockCount: 1,
          catalogAssetValue: 1495200,
        },
        replenishmentAlert: {
          productName: "JINGSENG PLUS",
          sku: "PZ-JSP-30",
          stockLeft: 28,
          daysLeft: 4,
        },
        items: [
          {
            id: "p1",
            name: "Ultra Hot Capsules",
            subtitle: "Herbal Vitality & Stamina Formula • 60 Veggie Caps",
            sku: "PZ-UHC-60",
            category: "Vitality & Performance",
            price: 1600,
            originalPrice: 2000,
            discountPercent: 20,
            stockCount: 340,
            stockStatus: "in_stock",
            status: "active",
          },
          {
            id: "p2",
            name: "JINGSENG PLUS",
            subtitle: "Premium Korean Red Ginseng Extract • 30 Softgels",
            sku: "PZ-JSP-30",
            category: "Energy & Immunity",
            price: 1550,
            originalPrice: 1900,
            discountPercent: 18,
            stockCount: 28,
            stockStatus: "low_stock",
            status: "active",
          },
          {
            id: "p3",
            name: "Ling Long Capsules",
            subtitle: "Ancient Herbal Endurance Complex • 45 Herbal Caps",
            sku: "PZ-LLC-45",
            category: "Herbal Wellness",
            price: 1300,
            originalPrice: 1650,
            discountPercent: 21,
            stockCount: 496,
            stockStatus: "in_stock",
            status: "active",
          },
        ],
      })
      setHasLoaded(true)
      setLoading(false)
    }, 300)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const id = ++requestIdRef.current
    doFetch(controller.signal, id)
    return () => controller.abort()
  }, [doFetch])

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    searchScheduledRef.current = true
    setInputValue(e.target.value)
    setSearchSequence((seq) => seq + 1)
  }

  useEffect(() => {
    if (!searchScheduledRef.current) return
    searchScheduledRef.current = false
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debouncedSearch.value.trim()) {
          next.set("q", debouncedSearch.value.trim())
        } else {
          next.delete("q")
        }
        next.set("page", "1")
        return next
      },
      { replace: false }
    )
  }, [debouncedSearch, setSearchParams])

  const metrics = data?.metrics ?? {
    activeProducts: 0,
    availableStock: 0,
    lowStockCount: 0,
    catalogAssetValue: 0,
  }

  // Column definitions for react-data-table-component
  const columns: TableColumn<ProductItem>[] = useMemo(
    () => [
      {
        name: "Product Info & SKU",
        selector: (row) => row.name,
        minWidth: "300px",
        cell: (row) => (
          <div className="flex items-center gap-3 py-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-(--border-light) text-xs font-bold text-(--text-muted)">
              IMG
            </div>
            <div>
              <div className="font-semibold text-(--text-primary)">
                {row.name}
              </div>
              <div className="text-xs text-(--text-muted)">{row.subtitle}</div>
              <div className="mt-0.5 font-mono text-[11px] text-primary">
                {row.sku}
              </div>
            </div>
          </div>
        ),
      },
      {
        name: "Category",
        selector: (row) => row.category,
        cell: (row) => (
          <span className="rounded-md border border-(--border-light) bg-(--bg-surface-hover) px-2.5 py-1 text-xs font-medium text-(--text-primary)">
            {row.category}
          </span>
        ),
      },
      {
        name: "Pricing (BDT)",
        selector: (row) => row.price,
        cell: (row) => (
          <div>
            <div className="font-semibold text-(--text-primary) tabular-nums">
              {formatTaka(row.price)}
              {row.discountPercent && (
                <span className="ml-1.5 rounded bg-(--status-pending-bg) px-1.5 py-0.5 text-[10px] font-bold text-[var(--status-pending-text)]">
                  -{row.discountPercent}%
                </span>
              )}
            </div>
            {row.originalPrice && (
              <div className="text-xs text-[var(--text-muted)] tabular-nums line-through">
                {formatTaka(row.originalPrice)}
              </div>
            )}
          </div>
        ),
      },
      {
        name: "Stock Level",
        selector: (row) => row.stockCount,
        cell: (row) => {
          const isLow = row.stockStatus === "low_stock"
          return (
            <div>
              <div className="font-semibold text-[var(--text-primary)] tabular-nums">
                {row.stockCount} units
              </div>
              <div
                className={`mt-0.5 text-xs font-medium ${isLow ? "text-amber-600" : "text-emerald-600"}`}
              >
                ● {isLow ? "Low stock" : "In stock"}
              </div>
            </div>
          )
        },
      },
      {
        name: "Status",
        selector: (row) => row.status,
        center: true,
        cell: (row) => (
          <StatusBadge
            variant="success"
            label={row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          />
        ),
      },
    ],
    []
  )

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Products
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {metrics.activeProducts} SKUs Active
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Manage herbal supplement catalog, inventory counts, and pricing
            across regional channels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary"
          >
            <Download className="icon-size" />
            Export Catalog
          </button>
          <Link
            to="/admin/products/new"
            className="admin-template-button admin-template-button--primary"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Top Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="admin-dashboard-card flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Active Products
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {metrics.activeProducts}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              Live in catalog
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] font-bold text-[var(--primary)]">
            📦
          </div>
        </div>

        <div className="admin-dashboard-card flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Available Stock
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {metrics.availableStock}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              Units in hub
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] font-bold text-[var(--primary)]">
            📊
          </div>
        </div>

        <div className="admin-dashboard-card flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Low Stock Alert
            </div>
            <div className="mt-1 text-2xl font-bold text-amber-600 tabular-nums">
              {metrics.lowStockCount} SKU
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              Requires PO
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 font-bold text-amber-600">
            ⚠️
          </div>
        </div>

        <div className="admin-dashboard-card flex items-center justify-between p-4">
          <div>
            <div className="text-xs font-bold tracking-wider text-[var(--text-muted)] uppercase">
              Catalog Asset Value
            </div>
            <div className="mt-1 text-2xl font-bold text-[var(--text-primary)] tabular-nums">
              {formatTaka(metrics.catalogAssetValue)}
            </div>
            <div className="mt-0.5 text-xs text-[var(--text-muted)]">
              Total valuation
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--bg-surface-hover)] font-bold text-[var(--primary)]">
            ৳
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="admin-dashboard-card overflow-hidden">
        {/* Search & Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] bg-white px-4 py-3">
          <SearchInput
            id="products-search"
            label="Search products"
            labelClassName="sr-only"
            placeholder="Search by product name, SKU, or category"
            value={inputValue}
            onChange={handleSearchChange}
            inputClassName="rounded-md border border-[var(--border-light)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] w-80"
          />
          <div className="text-xs text-[var(--text-muted)]">
            Showing {data?.items.length ?? 0} of {data?.total ?? 0}
          </div>
        </div>

        {/* Content Table / States */}
        {loading && !hasLoaded ? (
          <LoadingState className="flex items-center justify-center py-16 text-sm text-[var(--text-muted)]">
            Loading products catalog…
          </LoadingState>
        ) : error ? (
          <ErrorState
            message={error}
            onRetry={() =>
              doFetch(new AbortController().signal, ++requestIdRef.current)
            }
            className="flex flex-col items-center gap-3 py-16 text-center"
          />
        ) : (
          <DataTable
            columns={columns}
            data={data?.items ?? []}
            customStyles={tableCustomStyles}
            pagination
            paginationServer
            paginationTotalRows={data?.total ?? 0}
            paginationDefaultPage={page}
            paginationPerPage={PAGE_LIMIT}
            paginationRowsPerPageOptions={[20]}
            onChangePage={(newPage) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                next.set("page", String(newPage))
                return next
              })
            }}
            noDataComponent={
              <div className="py-12 text-center text-[var(--text-muted)]">
                <EmptyState title="No products found in catalog." />
              </div>
            }
          />
        )}
      </div>

      {/* Bottom Replenishment Notice Banner */}
      {data?.replenishmentAlert && (
        <div className="admin-dashboard-card flex flex-col items-start justify-between gap-4 border-l-4 border-l-amber-500 bg-amber-50/40 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-amber-100 font-bold text-amber-700">
              🚨
            </div>
            <div>
              <span className="font-semibold text-[var(--text-primary)]">
                Replenishment Notice: {data.replenishmentAlert.productName} (
                {data.replenishmentAlert.sku})
              </span>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Only {data.replenishmentAlert.stockLeft} units left at Dhaka
                Central Hub. Estimated stock-out within{" "}
                {data.replenishmentAlert.daysLeft} days at current dispatch
                velocity.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--border-light)] bg-transparent px-3 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:bg-white hover:text-[var(--text-primary)]"
            >
              Dismiss
            </button>
            <button
              type="button"
              className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-amber-700"
            >
              Create Inbound PO
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
