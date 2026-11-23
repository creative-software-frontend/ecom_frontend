import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import DataTable, {
  useTableExport,
  type TableColumn,
} from "react-data-table-component"
import { ApiError } from "../../api/client"
import { getErrorMessage } from "../../lib/errors"
import { EmptyState } from "../../components/common/EmptyState"
import { ErrorState } from "../../components/common/ErrorState"
import { LoadingState } from "../../components/common/LoadingState"
import { StatusBadge } from "../../components/common/StatusBadge"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import type {
  OrderStatus,
  OrderListItem,
  OrderListParams,
  OrdersListResponse,
  UpdateStatusBody,
} from "../../types/order"
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../../lib/orderStatus"
import {
  CalendarDays,
  Check,
  Download,
  Plus,
  Printer,
  Search,
} from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"

const PAGE_LIMIT = 10
const STATUS_TABS: { value: "" | OrderStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
]

/**
 * Shared orders list view used by both the shop admin and super admin panels.
 * Panel-specific behavior (API, query keys, routes and extra filters) is passed in as config.
 */
export type OrdersViewProps = {
  api: {
    list(
      params: OrderListParams & { shopId?: number },
      signal?: AbortSignal
    ): Promise<OrdersListResponse>
    updateStatus(id: number | string, body: UpdateStatusBody): Promise<unknown>
  }
  queryKeys: {
    all: readonly unknown[]
    list(params: OrderListParams & { shopId?: number }): readonly unknown[]
  }
  basePath: string
  createOrderPath?: string
  exportFileName?: string
  showShopColumn?: boolean
  shopFilterOptions?: { id: number | string; name: string }[]
}

export function OrdersView({
  api,
  queryKeys,
  basePath,
  createOrderPath = `${basePath}/new`,
  exportFileName = "orders.csv",
  showShopColumn = false,
  shopFilterOptions,
}: OrdersViewProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const status = (searchParams.get("status") ?? "") as OrderStatus | ""
  const q = searchParams.get("q") ?? ""
  const shopId =
    shopFilterOptions && searchParams.get("shopId")
      ? Number(searchParams.get("shopId"))
      : undefined
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

  const queryClient = useQueryClient()
  const [selectedOrders, setSelectedOrders] = useState<OrderListItem[]>([])
  const [clearSelectedRows, setClearSelectedRows] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("")
  const [bulkMessage, setBulkMessage] = useState<string | null>(null)
  const params = useMemo(() => {
    const next: OrderListParams & { shopId?: number } = {
      page,
      limit: PAGE_LIMIT,
    }
    if (shopFilterOptions && shopId) next.shopId = shopId
    if (status) next.status = status
    if (paymentStatus === "paid" || paymentStatus === "unpaid") {
      next.paymentStatus = paymentStatus
    }
    if (area) next.area = area
    if (dateFrom) next.dateFrom = dateFrom
    if (dateTo) next.dateTo = dateTo
    if (q.trim()) next.q = q.trim()
    return next
  }, [
    page,
    shopFilterOptions,
    shopId,
    status,
    paymentStatus,
    area,
    dateFrom,
    dateTo,
    q,
  ])

  const {
    data,
    isPending: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.list(params),
    queryFn: ({ signal }) => api.list(params, signal),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, queryError) =>
      !(queryError instanceof ApiError && queryError.status >= 400) &&
      failureCount < 2,
  })

  const bulkStatusMutation = useMutation({
    mutationFn: ({
      orderIds,
      orderStatus,
    }: {
      orderIds: number[]
      orderStatus: OrderStatus
    }) =>
      Promise.allSettled(
        orderIds.map((id) => api.updateStatus(id, { orderStatus }))
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.all }),
  })
  const bulkUpdating = bulkStatusMutation.isPending

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

    setBulkMessage(null)
    try {
      const results = await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrders.map((order) => order.id),
        orderStatus: bulkStatus,
      })
      const failedCount = results.filter(
        (result) => result.status === "rejected"
      ).length

      setBulkStatus("")
      resetSelectedOrders()

      if (failedCount > 0) {
        setBulkMessage(
          `${results.length - failedCount} order(s) updated; ${failedCount} could not be updated. Check that the selected status transitions are allowed.`
        )
        return
      }

      setBulkMessage(`${results.length} order(s) updated successfully.`)
    } catch (mutationError) {
      setBulkMessage(
        getErrorMessage(mutationError, "Failed to update selected orders.")
      )
    }
  }
  const total = data?.total ?? 0
  const counts = data?.counts ?? {
    all: { count: 0, totalPrice: 0 },
    pending: { count: 0, totalPrice: 0 },
    confirmed: { count: 0, totalPrice: 0 },
    shipped: { count: 0, totalPrice: 0 },
    delivered: { count: 0, totalPrice: 0 },
    cancelled: { count: 0, totalPrice: 0 },
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
            to={`${basePath}/${row.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.orderNumber}
          </Link>
        ),
        width: "110px",
      },
      ...(showShopColumn
        ? [
            {
              name: "Shop",
              selector: (row: OrderListItem) => row.shopName,
              sortable: true,
              cell: (row: OrderListItem) => (
                <span className="inline-flex items-center rounded-md bg-(--bg-table-header) px-2 py-0.5 text-xs font-medium whitespace-nowrap text-(--text-primary)">
                  {row.shopName}
                </span>
              ),
              width: "150px",
            },
          ]
        : []),
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
        minWidth: "140px",
        cell: (row) => {
          const selling = row.currentPrice ?? row.total
          const buying = row.buyingPrice ?? 0
          const profit = selling - buying
          const profitPct = buying > 0 ? Math.round((profit / buying) * 100) : 0

          return (
            <div className="flex flex-col items-end leading-tight">
              <span className="text-sm font-semibold text-(--text-primary) tabular-nums">
                {formatTaka(selling)}
              </span>
              {buying > 0 ? (
                <span className="text-[11px] text-(--text-muted) tabular-nums">
                  Buy {formatTaka(buying)}
                  <span
                    className={`ml-1 font-medium ${
                      profit >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    · Profit {profit >= 0 ? "+" : ""}
                    {formatTaka(profit)} ({profit >= 0 ? "+" : ""}
                    {profitPct}%)
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-(--text-muted) italic">
                  No cost set
                </span>
              )}
            </div>
          )
        },
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
              className="text-xs!"
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
              className="text-xs!"
            />
          )
        },
      },
    ],
    [basePath, showShopColumn]
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
            onClick={() => download(exportFileName)}
            className="admin-template-button admin-template-button--secondary h-8 px-3 text-xs"
          >
            <Download className="icon-size" /> Export CSV
          </button>
          <Link
            to={createOrderPath}
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
          {shopFilterOptions ? (
            <label className="min-w-40 flex-1 sm:flex-none">
              <span className="sr-only">Filter by shop</span>
              <select
                value={shopId?.toString() ?? ""}
                onChange={(event) => updateFilter("shopId", event.target.value)}
                className="h-9 w-full rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">All Shops</option>
                {shopFilterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
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
          <span className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-(--bg-app) px-3 text-xs font-medium text-(--text-primary)">
            <span className="size-1.5 rounded-full bg-primary" />
            {total} of {counts.all?.count} shown
          </span>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex scrollbar-none gap-1 overflow-x-auto border-b border-(--border-light) bg-(--bg-table-header) px-4 pt-3 whitespace-nowrap">
          {STATUS_TABS.map(({ value, label }) => {
            const count =
              value === ""
                ? counts.all.count
                : counts[value as keyof typeof counts].count
            const totalPrice =
              value === ""
                ? counts.all.totalPrice
                : counts[value as keyof typeof counts].totalPrice
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
                <span> • ৳{totalPrice}</span>
              </button>
            )
          })}
        </div>

        {/* Bulk Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-(--border-light) bg-white px-3 py-2.5">
          <span className="inline-flex h-9 shrink-0 items-center rounded-full bg-rose-100 px-3 text-xs font-semibold text-red-800">
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
            onClick={() => {
              const ids = selectedOrders.map((o) => o.id).join(",")
              void navigate(`${basePath}/invoice?ids=${ids}`)
            }}
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
        {loading ? (
          <LoadingState className="flex items-center justify-center py-16 text-sm text-(--text-muted)">
            Loading orders…
          </LoadingState>
        ) : isError ? (
          <ErrorState
            message={getErrorMessage(error, "Failed to load orders.")}
            onRetry={() => void refetch()}
            className="flex flex-col items-center gap-3 py-16 text-center"
          />
        ) : (
          <DataTable
            className="admin-data-table"
            keyField="id"
            columns={columns}
            data={data?.items ?? []}
            customStyles={adminDataTableStyles}
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
    </div>
  )
}
