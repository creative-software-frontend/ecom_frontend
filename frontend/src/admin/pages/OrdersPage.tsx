import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import DataTable, {
  useTableExport,
  type TableColumn,
} from "react-data-table-component"
import { ordersApi } from "../api/ordersApi"
import { ApiError } from "../api/client"
import { EmptyState } from "../components/common/EmptyState"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { SearchInput } from "../components/common/SearchInput"
import { StatusBadge } from "../components/common/StatusBadge"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import type {
  OrderStatus,
  OrdersListResponse,
  OrderListItem,
} from "../types/order"
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../lib/orderStatus"
import { Download, Plus } from "lucide-react"

const PAGE_LIMIT = 10
const STATUS_TABS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

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
      minHeight: "44px",
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

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = (searchParams.get("status") ?? "") as OrderStatus | ""
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
  const [data, setData] = useState<OrdersListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestIdRef = useRef(0)

  const doFetch = useCallback(
    (signal: AbortSignal, id: number) => {
      setLoading(true)
      setError(null)
      const params: Parameters<typeof ordersApi.list>[0] = {
        page,
        limit: PAGE_LIMIT,
      }
      if (status) params.status = status as OrderStatus
      if (q.trim()) params.q = q.trim()

      ordersApi
        .list(params, signal)
        .then((result) => {
          if (id !== requestIdRef.current) return
          setData(result)
          setHasLoaded(true)
          setLoading(false)
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return
          if (id !== requestIdRef.current) return
          setHasLoaded(true)
          setLoading(false)
          setError(
            err instanceof ApiError ? err.message : "Failed to load orders."
          )
        })
    },
    [page, status, q]
  )

  useEffect(() => {
    const controller = new AbortController()
    const id = ++requestIdRef.current
    doFetch(controller.signal, id)
    return () => controller.abort()
  }, [doFetch])

  function handleStatusTab(value: "" | OrderStatus) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set("status", value)
        else next.delete("status")
        next.set("page", "1")
        return next
      },
      { replace: false }
    )
  }

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

  const total = data?.total ?? 0
  const counts = data?.counts ?? {
    all: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  // React Data Table Column Definitions
  const columns: TableColumn<OrderListItem>[] = useMemo(
    () => [
      {
        name: "Order",
        selector: (row) => row.orderNumber,
        sortable: false,
        cell: (row) => (
          <Link
            to={`/admin/orders/${row.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
        ),
        width: "110px",
      },
      {
        name: "Date & Time",
        selector: (row) => row.createdAt,
        cell: (row) => (
          <span className="text-xs text-(--text-muted) tabular-nums">
            {formatOrderDate(row.createdAt)}
          </span>
        ),
      },
      {
        name: "Customer",
        selector: (row) => row.customerName,
        cell: (row) => (
          <div>
            <div className="font-medium text-(--text-primary)">
              {row.customerName}
            </div>
            <div className="text-xs text-(--text-muted) tabular-nums">
              {row.customerPhone}
            </div>
          </div>
        ),
        minWidth: "180px",
      },
      {
        name: "Delivery Area",
        selector: (row) => row.deliveryArea,
        cell: (row) => (
          <span className="text-(--text-muted)">{row.deliveryArea}</span>
        ),
      },
      {
        name: "Items",
        selector: (row) => row.itemCount,
        cell: (row) => (
          <span className="font-medium text-(--text-primary)">
            {row.itemCount} {row.itemCount === 1 ? "item" : "items"}
          </span>
        ),
        width: "90px",
      },
      {
        name: "Total",
        selector: (row) => row.total,
        right: true,
        cell: (row) => (
          <span className="font-semibold text-(--text-primary) tabular-nums">
            {formatTaka(row.total)}
          </span>
        ),
      },
      {
        name: "Payment",
        selector: (row) => row.paymentStatus,
        center: true,
        cell: (row) => {
          const payCfg = PAYMENT_STATUS_CONFIG[row.paymentStatus]
          return <StatusBadge variant={payCfg.variant} label={payCfg.label} />
        },
      },
      {
        name: "Status",
        selector: (row) => row.orderStatus,
        center: true,
        cell: (row) => {
          const orderCfg = ORDER_STATUS_CONFIG[row.orderStatus]
          return (
            <StatusBadge variant={orderCfg.variant} label={orderCfg.label} />
          )
        },
      },
    ],
    []
  )

  const { download } = useTableExport<OrderListItem>({
    columns,
    rows: data?.items ?? [],
  })

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-(--text-primary)">Orders</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-(--text-muted)">
              {total} Total
            </span>
          </div>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Manage and confirm customer orders across Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => download("orders.csv")}
            className="admin-template-button admin-template-button--secondary"
          >
            <Download className="icon-size" /> Export CSV
          </button>
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary"
          >
            Bulk Status
          </button>
          <Link
            to="/admin/orders/new"
            className="admin-template-button admin-template-button--primary"
          >
            <Plus className="icon-size" /> Create Order
          </Link>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="admin-dashboard-card overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-(--border-light) bg-(--bg-table-header) px-4 pt-3">
          {STATUS_TABS.map(({ value, label }) => {
            const count =
              value === "" ? counts.all : counts[value as keyof typeof counts]
            const isActive = status === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusTab(value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-b-2 border-b-primary text-primary"
                    : "cursor-pointer border-b-2 border-b-transparent text-(--text-muted) hover:text-(--text-primary)"
                }`}
              >
                {label} <span className="ml-1 opacity-75">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search & Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border-light) bg-white px-4 py-3">
          <SearchInput
            id="orders-search"
            label="Search orders"
            labelClassName="sr-only"
            placeholder="Search by order number, name or phone"
            value={inputValue}
            onChange={handleSearchChange}
            inputClassName="rounded-md border border-(--border-light) px-3 py-1.5 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary) w-80"
          />
        </div>

        {/* Content Table / Loading / Error states */}
        {loading && !hasLoaded ? (
          <LoadingState className="flex items-center justify-center py-16 text-sm text-(--text-muted)">
            Loading orders…
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
            paginationTotalRows={total}
            paginationDefaultPage={page}
            paginationPerPage={PAGE_LIMIT}
            paginationRowsPerPageOptions={[10, 20, 50]}
            onChangePage={(newPage) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                next.set("page", String(newPage))
                return next
              })
            }}
            noDataComponent={
              <div className="py-12 text-center text-(--text-muted)">
                <EmptyState title="No orders found." />
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
