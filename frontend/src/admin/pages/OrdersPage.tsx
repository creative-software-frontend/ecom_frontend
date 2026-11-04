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
import {
  CalendarDays,
  Check,
  Download,
  Plus,
  Printer,
  Search,
} from "lucide-react"
import { tableCustomStyles } from "../lib/dataTableStyles"

const PAGE_LIMIT = 10
const STATUS_TABS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

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
  const [selectedOrders, setSelectedOrders] = useState<OrderListItem[]>([])
  const [clearSelectedRows, setClearSelectedRows] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("")
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const [refreshSequence, setRefreshSequence] = useState(0)

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
  }, [doFetch, refreshSequence])

  function resetSelectedOrders() {
    setSelectedOrders([])
    setClearSelectedRows((previous) => !previous)
    setBulkMessage(null)
  }

  function handleStatusTab(value: "" | OrderStatus) {
    resetSelectedOrders()
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
    resetSelectedOrders()
    searchScheduledRef.current = true
    setInputValue(e.target.value)
    setSearchSequence((seq) => seq + 1)
  }

  function updateFilter(key: string, value: string) {
    resetSelectedOrders()
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
    setBulkMessage(null)
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

  async function handleBulkStatusUpdate() {
    if (!bulkStatus || selectedOrders.length === 0 || bulkUpdating) return

    setBulkUpdating(true)
    setBulkMessage(null)
    const results = await Promise.allSettled(
      selectedOrders.map((order) =>
        ordersApi.updateStatus(order.id, { orderStatus: bulkStatus })
      )
    )
    const failedCount = results.filter(
      (result) => result.status === "rejected"
    ).length

    setBulkUpdating(false)
    setBulkStatus("")
    resetSelectedOrders()
    setRefreshSequence((sequence) => sequence + 1)

    if (failedCount > 0) {
      setBulkMessage(
        `${results.length - failedCount} order(s) updated; ${failedCount} could not be updated. Check that the selected status transitions are allowed.`
      )
      return
    }

    setBulkMessage(`${results.length} order(s) updated successfully.`)
  }

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
        sortable: true,
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
        sortable: true,
        cell: (row) => (
          <span className="text-xs text-(--text-muted) tabular-nums">
            {formatOrderDate(row.createdAt)}
          </span>
        ),
      },
      {
        name: "Customer",
        selector: (row) => row.customerName,
        sortable: true,
        cell: (row) => (
          <div className="space-y-0.5 py-0.5">
            <div className="font-medium text-(--text-primary)">
              {row.customerName}
            </div>
            <div className="text-xs text-(--text-muted) tabular-nums">
              {row.customerPhone}
            </div>
            <div className="text-xs text-(--text-muted) tabular-nums">
              {row.customerAddress}
            </div>
          </div>
        ),
        minWidth: "180px",
      },
      {
        name: "Delivery Area",
        selector: (row) => row.deliveryArea,
        sortable: true,
        cell: (row) => (
          <span className="text-(--text-muted)">{row.deliveryArea}</span>
        ),
      },
      {
        name: "Items",
        selector: (row) => row.itemCount,
        sortable: true,
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
        sortable: true,
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
        sortable: true,
        center: true,
        cell: (row) => {
          const payCfg = PAYMENT_STATUS_CONFIG[row.paymentStatus]
          return (
            <StatusBadge
              variant={payCfg.variant}
              label={payCfg.label}
              className="text-[10px]!"
            />
          )
        },
      },
      {
        name: "Status",
        selector: (row) => row.orderStatus,
        sortable: true,
        center: true,
        cell: (row) => {
          const orderCfg = ORDER_STATUS_CONFIG[row.orderStatus]
          return (
            <StatusBadge
              variant={orderCfg.variant}
              label={orderCfg.label}
              className="text-[10px]!"
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-(--text-primary)">Orders</h1>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-(--text-muted)">
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
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-xs"
          >
            <Download className="icon-size" /> Export CSV
          </button>
          <Link
            to="/admin/orders/new"
            className="admin-template-button admin-template-button--primary h-8 px-3 text-xs"
          >
            <Plus className="icon-size" /> Create Order
          </Link>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="admin-dashboard-card overflow-hidden print:hidden">
        {/* Search & Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-light) bg-white px-3 py-3">
          <label className="relative min-w-55 flex-1">
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
              className="h-9 w-full rounded-md border border-(--border-light) bg-white pr-3 pl-9 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </label>
          <div className="flex h-9 min-w-57.5 flex-1 items-center gap-2 rounded-md border border-(--border-light) bg-white px-2.5 text-xs text-(--text-primary) sm:flex-none">
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
          <label className="min-w-30 flex-1 sm:flex-none">
            <span className="sr-only">Filter by delivery area</span>
            <select
              value={area}
              onChange={(event) => updateFilter("area", event.target.value)}
              className="h-9 w-full rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">All Areas</option>
              {(data?.areas ?? []).map((orderArea) => (
                <option key={orderArea} value={orderArea}>
                  {orderArea}
                </option>
              ))}
            </select>
          </label>
          <label className="min-w-32.5 flex-1 sm:flex-none">
            <span className="sr-only">Filter by payment status</span>
            <select
              value={paymentStatus}
              onChange={(event) =>
                updateFilter("paymentStatus", event.target.value)
              }
              className="h-9 w-full rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="">All Payment</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </label>
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-[#eef0ff] px-3 text-xs font-medium text-(--text-primary)">
            <span className="size-1.5 rounded-full bg-primary" />
            {total} of {counts.all} shown
          </span>
        </div>

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
                aria-pressed={isActive}
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

        {/* Bulk Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-light) bg-white px-3 py-2.5">
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#fce8e8] px-3 text-xs font-semibold text-[#9b1c1c]">
            Selected ({selectedOrders.length})
          </span>
          <button
            type="button"
            disabled
            title="SMS sending is not configured"
            className="admin-template-button admin-template-button--secondary h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            SMS
          </button>
          <button
            type="button"
            disabled={selectedOrders.length === 0}
            onClick={() => window.print()}
            className="admin-template-button admin-template-button--secondary h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer className="icon-size" /> Print
          </button>
          <label>
            <span className="sr-only">Update selected order status</span>
            <select
              value={bulkStatus}
              onChange={(event) =>
                setBulkStatus(event.target.value as OrderStatus | "")
              }
              disabled={selectedOrders.length === 0 || bulkUpdating}
              className="h-9 min-w-36.25 rounded-md border border-(--border-hover) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Update status</option>
              {STATUS_TABS.filter(({ value }) => value !== "").map(
                ({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
          <label>
            <span className="sr-only">Update selected order source</span>
            <select
              disabled
              title="Order sources are not configured"
              className="h-9 min-w-36.25 rounded-md border border-(--border-hover) bg-white px-3 text-xs text-(--text-primary) outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>Update source</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Assign selected orders to employee</span>
            <select
              disabled
              title="Employee assignment is not configured"
              className="h-9 min-w-38.75 rounded-md border border-(--border-hover) bg-white px-3 text-xs text-(--text-primary) outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>Assign employee</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Assign selected orders to courier</span>
            <select
              disabled
              title="Courier assignment is not configured"
              className="h-9 min-w-36.25 rounded-md border border-(--border-hover) bg-white px-3 text-xs text-(--text-primary) outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option>Assign courier</option>
            </select>
          </label>
          <button
            type="button"
            disabled={
              selectedOrders.length === 0 || !bulkStatus || bulkUpdating
            }
            onClick={handleBulkStatusUpdate}
            className="admin-template-button admin-template-button--primary h-9 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="icon-size" />
            {bulkUpdating ? "Applying…" : "Apply"}
          </button>
        </div>
        {bulkMessage ? (
          <p
            role="status"
            className="border-b border-(--border-light) bg-white px-4 py-2 text-xs text-(--text-muted)"
          >
            {bulkMessage}
          </p>
        ) : null}

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
            keyField="id"
            columns={columns}
            data={data?.items ?? []}
            customStyles={tableCustomStyles}
            selectableRows
            selectableRowsHighlight
            clearSelectedRows={clearSelectedRows}
            onSelectedRowsChange={({ selectedRows }) =>
              setSelectedOrders(selectedRows)
            }
            pagination
            paginationServer
            paginationTotalRows={total}
            paginationDefaultPage={page}
            paginationPerPage={PAGE_LIMIT}
            paginationRowsPerPageOptions={[10, 20, 50]}
            onChangePage={(newPage) => {
              resetSelectedOrders()
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
      <section className="hidden p-8 print:block">
        <h1 className="mb-4 text-xl font-bold">Selected Orders</h1>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-2 text-left">Order</th>
              <th className="border p-2 text-left">Customer</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-left">Delivery Area</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {selectedOrders.map((order) => (
              <tr key={order.id}>
                <td className="border p-2">{order.orderNumber}</td>
                <td className="border p-2">{order.customerName}</td>
                <td className="border p-2">{order.customerPhone}</td>
                <td className="border p-2">{order.deliveryArea}</td>
                <td className="border p-2">{order.orderStatus}</td>
                <td className="border p-2 text-right">
                  {formatTaka(order.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
