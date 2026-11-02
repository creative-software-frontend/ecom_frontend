import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { ordersApi } from "../api/ordersApi"
import { ApiError } from "../api/client"
import { EmptyState } from "../components/common/EmptyState"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { Pagination } from "../components/common/Pagination"
import { SearchInput } from "../components/common/SearchInput"
import { StatusBadge } from "../components/common/StatusBadge"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import type { OrderStatus, OrdersListResponse } from "../types/order"
import {
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../lib/orderStatus"

const PAGE_LIMIT = 20
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

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              Orders
            </h1>
            <span className="rounded-full bg-[var(--border-light)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
              {total} Total
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Manage and confirm customer orders across Bangladesh
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary"
          >
            Export CSV
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
            + Create Order
          </Link>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="admin-dashboard-card overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-[var(--border-light)] bg-[var(--bg-table-header)] px-4 py-3">
          {STATUS_TABS.map(({ value, label }) => {
            const count =
              value === "" ? counts.all : counts[value as keyof typeof counts]
            const isActive = status === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleStatusTab(value)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-[var(--border-light)] hover:text-[var(--text-primary)]"
                }`}
              >
                {label} <span className="ml-1 opacity-75">({count})</span>
              </button>
            )
          })}
        </div>

        {/* Search & Filters Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-light)] bg-white px-4 py-3">
          <SearchInput
            id="orders-search"
            label="Search orders"
            labelClassName="sr-only"
            placeholder="Search by order number, name or phone"
            value={inputValue}
            onChange={handleSearchChange}
            inputClassName="rounded-md border border-[var(--border-light)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] w-80"
          />
        </div>

        {/* Content Table / Loading / Error states */}
        {loading && !hasLoaded ? (
          <LoadingState className="flex items-center justify-center py-16 text-sm text-[var(--text-muted)]">
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="border-b border-[var(--border-light)] bg-[var(--bg-table-header)] text-xs font-semibold text-[var(--text-muted)] uppercase">
                  <tr>
                    <th className="px-4 py-3">Order #</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Delivery Area</th>
                    <th className="px-4 py-3">Items Summary</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-center">Payment</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-light)]">
                  {data?.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-[var(--text-muted)]"
                      >
                        <EmptyState title="No orders found." />
                      </td>
                    </tr>
                  ) : (
                    data?.items.map((order) => {
                      const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
                      const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
                      return (
                        <tr
                          key={order.id}
                          className="transition-colors hover:bg-[var(--bg-surface-hover)]"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--primary)]">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              className="hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--text-muted)] tabular-nums">
                            {formatOrderDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[var(--text-primary)]">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] tabular-nums">
                              {order.customerPhone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-muted)]">
                            {order.deliveryArea}
                          </td>
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
                            {order.itemCount}{" "}
                            {order.itemCount === 1 ? "item" : "items"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[var(--text-primary)] tabular-nums">
                            {formatTaka(order.total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              variant={payCfg.variant}
                              label={payCfg.label}
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusBadge
                              variant={orderCfg.variant}
                              label={orderCfg.label}
                            />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {total > 0 && (
              <Pagination
                page={page}
                pageSize={PAGE_LIMIT}
                total={total}
                onChange={(newPage) => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.set("page", String(newPage))
                    return next
                  })
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
