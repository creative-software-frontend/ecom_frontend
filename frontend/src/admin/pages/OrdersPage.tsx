import { useCallback, useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router"
import { ordersApi } from "../api/ordersApi"
import { ApiError } from "../api/client"
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

function parseParams(sp: URLSearchParams) {
  const status = (sp.get("status") ?? "") as OrderStatus | ""
  const q = sp.get("q") ?? ""
  const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1)
  return { status, q, page }
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { status, q, page } = parseParams(searchParams)

  // Live search input value (debounced → URL). Keep in sync with URL via key reset trick below
  const [inputValue, setInputValue] = useState(q)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // We track whether we've received ANY data yet so we can show the initial skeleton
  const [hasLoaded, setHasLoaded] = useState(false)

  // Data state
  const [data, setData] = useState<OrdersListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Incrementing request id — used to discard stale responses
  const requestIdRef = useRef(0)

  // -------------------------------------------------------------------
  // Sync inputValue when URL `q` changes (e.g. browser back / Clear filters)
  // We do it inside the event handlers directly to avoid the set-state-in-effect lint rule.
  // -------------------------------------------------------------------

  // -------------------------------------------------------------------
  // Fetch function
  // -------------------------------------------------------------------
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
          if (id !== requestIdRef.current) return // stale response
          setData(result)
          setHasLoaded(true)
          setLoading(false)

          // If current page is beyond last page, jump to last page
          const totalPages = Math.max(1, Math.ceil(result.total / PAGE_LIMIT))
          if (page > totalPages) {
            setSearchParams(
              (prev) => {
                const next = new URLSearchParams(prev)
                next.set("page", String(totalPages))
                return next
              },
              { replace: true }
            )
          }
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
    [page, status, q, setSearchParams]
  )

  // -------------------------------------------------------------------
  // Effect: run fetch whenever params change
  // -------------------------------------------------------------------
  useEffect(() => {
    const controller = new AbortController()
    const id = ++requestIdRef.current
    doFetch(controller.signal, id)
    return () => {
      controller.abort()
    }
  }, [doFetch])

  // -------------------------------------------------------------------
  // Retry handler (re-triggers effect by bumping a counter)
  // -------------------------------------------------------------------
  const [retryCount, setRetryCount] = useState(0)
  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1)
  }, [])

  // When retryCount changes, re-run the fetch directly
  useEffect(() => {
    if (retryCount === 0) return
    const controller = new AbortController()
    const id = ++requestIdRef.current
    doFetch(controller.signal, id)
    return () => {
      controller.abort()
    }
  }, [retryCount, doFetch])

  // -------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------

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
    const val = e.target.value
    setInputValue(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (val.trim()) next.set("q", val.trim())
          else next.delete("q")
          next.set("page", "1")
          return next
        },
        { replace: false }
      )
    }, 300)
  }

  function handleClearFilters() {
    setInputValue("")
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSearchParams({}, { replace: false })
  }

  function handlePrev() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(Math.max(1, page - 1)))
        return next
      },
      { replace: false }
    )
  }

  function handleNext() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("page", String(page + 1))
        return next
      },
      { replace: false }
    )
  }

  // -------------------------------------------------------------------
  // Derived values
  // -------------------------------------------------------------------

  const hasFilters = !!status || !!q.trim()
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT))
  const showFrom = total === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1
  const showTo = Math.min(page * PAGE_LIMIT, total)

  const counts = data?.counts ?? {
    all: 0,
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  }

  const isInitialLoading = loading && !hasLoaded
  const isSubsequentLoading = loading && hasLoaded

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------

  return (
    <section
      className="min-w-0 overflow-hidden admin-dashboard-card bg-white"
      aria-labelledby="orders-page-title"
    >
      {/* Header */}
      <header className="flex min-h-[56px] flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-6">
        <h1 id="orders-page-title" className="text-sm font-bold text-gray-700">
          Orders
        </h1>

        {/* Search */}
        <div className="flex items-center gap-2">
          <label htmlFor="orders-search" className="sr-only">
            Search orders
          </label>
          <input
            id="orders-search"
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Order number, name or phone"
            className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-[#3f6ad8] focus:ring-1 focus:ring-[#3f6ad8]"
            style={{ minWidth: 220 }}
          />
        </div>
      </header>

      {/* Status filter tabs */}
      <div
        className="flex flex-wrap gap-1 border-b border-gray-200 px-4 py-2 sm:px-6"
        role="group"
        aria-label="Filter by order status"
      >
        {STATUS_TABS.map(({ value, label }) => {
          const count =
            value === "" ? counts.all : counts[value as keyof typeof counts]
          const isActive = status === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleStatusTab(value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "bg-[#3f6ad8] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
              {data && (
                <span
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Screen-reader loading indicator */}
      {isSubsequentLoading && (
        <p className="sr-only" role="status" aria-live="polite">
          Loading
        </p>
      )}

      {/* Body — dimmed while subsequent loading */}
      <div
        className={
          isSubsequentLoading
            ? "opacity-60 transition-opacity duration-200"
            : "transition-opacity duration-200"
        }
      >
        {/* Initial loading skeleton */}
        {isInitialLoading && (
          <div
            className="flex items-center justify-center py-16 text-sm text-gray-500"
            role="status"
            aria-live="polite"
          >
            Loading orders…
          </div>
        )}

        {/* Error state */}
        {!isInitialLoading && error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded bg-[#3f6ad8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3458b5]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!isInitialLoading && !error && data && (
          <>
            <div className="w-full admin-orders-scroll overflow-x-auto">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm text-gray-700">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Order #
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Area
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Payment
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-center text-xs font-bold tracking-wide text-gray-600 uppercase"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-sm text-gray-500"
                      >
                        {hasFilters ? (
                          <div className="flex flex-col items-center gap-3">
                            <span>No orders match your filters.</span>
                            <button
                              type="button"
                              onClick={handleClearFilters}
                              className="rounded bg-gray-100 px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200"
                            >
                              Clear filters
                            </button>
                          </div>
                        ) : (
                          "No orders yet."
                        )}
                      </td>
                    </tr>
                  ) : (
                    data.items.map((order) => {
                      const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
                      const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
                      return (
                        <tr
                          key={order.id}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/orders/${order.id}`}
                              state={{ q: searchParams.toString() }}
                              className="font-medium text-[#3f6ad8] hover:underline"
                            >
                              {order.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                            {formatOrderDate(order.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-700">
                              {order.customerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {order.customerPhone}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                            {order.deliveryArea}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">
                            {order.itemCount}
                          </td>
                          <td className="px-4 py-3 text-right font-medium whitespace-nowrap text-gray-700">
                            {formatTaka(order.total)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={payCfg.badgeClassName}>
                              {payCfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={orderCfg.badgeClassName}>
                              {orderCfg.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > 0 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:px-6">
                <p className="text-sm text-gray-500">
                  Showing {showFrom}–{showTo} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={page <= 1}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={page >= totalPages}
                    className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </div>
    </section>
  )
}
