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
import { CalendarDays, Download, Plus, Search } from "lucide-react"

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
      fontSize: "10px",
      fontWeight: "600",
      textTransform: "uppercase" as const,
      paddingLeft: "12px",
      paddingRight: "12px",
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
      paddingLeft: "12px",
      paddingRight: "12px",
      color: "var(--text-primary)",
      fontSize: "12px",
    },
  },
  pagination: {
    style: {
      borderTop: "1px solid var(--border-light)",
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-muted)",
      fontSize: "10px",
      minHeight: "44px",
    },
  },
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = (searchParams.get("status") ?? "") as OrderStatus | ""
  const q = searchParams.get("q") ?? ""
  const paymentStatus = searchParams.get("paymentStatus") ?? ""
  const area = searchParams.get("area") ?? ""
  const dateFrom = searchParams.get("dateFrom") ?? ""
  const dateTo = searchParams.get("dateTo") ?? ""
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
      if (paymentStatus === "paid" || paymentStatus === "unpaid") {
        params.paymentStatus = paymentStatus
      }
      if (area) params.area = area
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
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
    [page, status, paymentStatus, area, dateFrom, dateTo, q]
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

  function updateFilter(key: string, value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(key, value)
        else next.delete(key)
        next.set("page", "1")
        return next
      },
      { replace: true }
    )
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
          return (
            <StatusBadge
              variant={payCfg.variant}
              label={payCfg.label}
              className="!text-[10px]"
            />
          )
        },
      },
      {
        name: "Status",
        selector: (row) => row.orderStatus,
        center: true,
        cell: (row) => {
          const orderCfg = ORDER_STATUS_CONFIG[row.orderStatus]
          return (
            <StatusBadge
              variant={orderCfg.variant}
              label={orderCfg.label}
              className="!text-[10px]"
            />
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
            <h1 className="text-lg font-bold text-(--text-primary)">Orders</h1>
            <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-(--text-muted)">
              {total} Total
            </span>
          </div>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Manage and confirm customer orders across Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => download("orders.csv")}
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-[11px]"
          >
            <Download className="icon-size" /> Export CSV
          </button>
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-[11px]"
          >
            Bulk Status
          </button>
          <Link
            to="/admin/orders/new"
            className="admin-template-button admin-template-button--primary h-8 px-3 text-[11px]"
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
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-light) bg-white px-3 py-3">
          <label className="relative min-w-[220px] flex-1">
            <span className="sr-only">Search orders</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-(--text-muted)"
              aria-hidden="true"
            />
            <input
              id="orders-search"
              type="search"
              placeholder="Search by order number, name or phone"
              value={inputValue}
              onChange={handleSearchChange}
              className="h-9 w-full rounded-md border border-(--border-light) bg-white pr-3 pl-9 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
            />
          </label>
          <div className="flex h-9 min-w-[230px] flex-1 items-center gap-2 rounded-md border border-(--border-light) bg-white px-2.5 text-xs text-(--text-primary) sm:flex-none">
            <CalendarDays
              className="size-3.5 shrink-0 text-(--text-muted)"
              aria-hidden="true"
            />
            <label className="min-w-0 flex-1">
              <span className="sr-only">Start date</span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) =>
                  updateFilter("dateFrom", event.target.value)
                }
                className="w-full min-w-0 bg-transparent text-xs outline-none"
              />
            </label>
            <span className="shrink-0 text-(--text-muted)" aria-hidden="true">
              –
            </span>
            <label className="min-w-0 flex-1">
              <span className="sr-only">End date</span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                className="w-full min-w-0 bg-transparent text-xs outline-none"
              />
            </label>
          </div>
          <label className="min-w-[120px] flex-1 sm:flex-none">
            <span className="sr-only">Filter by delivery area</span>
            <select
              value={area}
              onChange={(event) => updateFilter("area", event.target.value)}
              className="h-9 w-full rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
            >
              <option value="">All Areas</option>
              {(data?.areas ?? []).map((orderArea) => (
                <option key={orderArea} value={orderArea}>
                  {orderArea}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-[130px] flex-1 sm:flex-none">
            <span className="sr-only">Filter by payment status</span>
            <select
              value={paymentStatus}
              onChange={(event) =>
                updateFilter("paymentStatus", event.target.value)
              }
              className="h-9 w-full rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
            >
              <option value="">All Payment</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-[#eef0ff] px-3 text-xs font-medium text-(--text-primary)">
            <span className="size-1.5 rounded-full bg-(--primary)" />
            {total} of {counts.all} shown
          </span>
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
