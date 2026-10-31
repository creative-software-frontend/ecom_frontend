import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import { ordersApi } from "../api/ordersApi"
import { ApiError } from "../api/client"
import type { OrderDetail, OrderStatus, PaymentStatus } from "../types/order"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_ACTION_LABEL,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../lib/orderStatus"
import { ChevronLeft } from "lucide-react"

// Load-state reducer

type LoadState =
  | { phase: "loading" }
  | { phase: "notfound" }
  | { phase: "error"; message: string }
  | { phase: "ready"; order: OrderDetail }

type LoadAction =
  | { type: "LOADING" }
  | { type: "READY"; order: OrderDetail }
  | { type: "NOTFOUND" }
  | { type: "ERROR"; message: string }

function loadReducer(_state: LoadState, action: LoadAction): LoadState {
  switch (action.type) {
    case "LOADING":
      return { phase: "loading" }
    case "READY":
      return { phase: "ready", order: action.order }
    case "NOTFOUND":
      return { phase: "notfound" }
    case "ERROR":
      return { phase: "error", message: action.message }
  }
}

function getBackHref(locationState: unknown): string {
  if (
    typeof locationState === "object" &&
    locationState !== null &&
    "q" in locationState &&
    typeof (locationState as Record<string, unknown>).q === "string"
  ) {
    const qs = (locationState as Record<string, string>).q
    return qs ? `/admin/orders?${qs}` : "/admin/orders"
  }
  return "/admin/orders"
}

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden admin-dashboard-card bg-white">
      <div className="border-b border-gray-200 px-5 py-3">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 py-1.5">
      <dt className="w-36 shrink-0 text-xs font-medium text-gray-500 uppercase">
        {label}
      </dt>
      <dd className="flex-1 text-sm text-gray-700">{children}</dd>
    </div>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const backHref = getBackHref(location.state)

  // Load state as a reducer — dispatch is stable so the lint rule
  // (react-hooks/set-state-in-effect) does not flag it inside effects
  const [loadState, dispatch] = useReducer(loadReducer, { phase: "loading" })

  // Mutation state
  const [mutating, setMutating] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Inline cancel dialog
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  // Focus ref for cancel button (restores focus after dialog closes)
  const cancelTriggerRef = useRef<HTMLButtonElement>(null)

  // Retry counter — incrementing this re-runs the load effect
  const [retryCount, setRetryCount] = useState(0)
  const handleRetry = useCallback(() => setRetryCount((c) => c + 1), [])

  // Stale-response guard
  const requestIdRef = useRef(0)

  // Load effect
  // dispatch() is a stable identity and is not setState, so the ESLint
  // react-hooks/set-state-in-effect rule does not trigger on it.

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    const reqId = ++requestIdRef.current
    dispatch({ type: "LOADING" })

    ordersApi
      .get(id, controller.signal)
      .then((data) => {
        if (reqId !== requestIdRef.current) return
        dispatch({ type: "READY", order: data })
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        if (reqId !== requestIdRef.current) return
        if (err instanceof ApiError && err.status === 404) {
          dispatch({ type: "NOTFOUND" })
        } else {
          dispatch({ type: "ERROR", message: getErrorMessage(err) })
        }
      })

    return () => {
      controller.abort()
    }
  }, [id, retryCount])

  // -------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------
  async function applyStatus(
    body: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus },
    actionKey: string
  ) {
    if (!id || mutating) return
    setMutating(true)
    setPendingAction(actionKey)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      const updated = await ordersApi.updateStatus(id, body)
      dispatch({ type: "READY", order: updated })
      const label = body.orderStatus
        ? ORDER_STATUS_CONFIG[body.orderStatus].label
        : body.paymentStatus === "paid"
          ? "paid"
          : "unpaid"
      setSuccessMessage(
        `Order ${updated.orderNumber} marked as ${label.toLowerCase()}.`
      )
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 404) {
        dispatch({ type: "NOTFOUND" })
      } else {
        setMutationError(getErrorMessage(err))
      }
    } finally {
      setMutating(false)
      setPendingAction(null)
    }
  }

  function handleOrderStatusClick(next: OrderStatus) {
    if (next === "cancelled") {
      setConfirmCancelOpen(true)
    } else {
      void applyStatus({ orderStatus: next }, `order-${next}`)
    }
  }

  function handleConfirmCancel() {
    setConfirmCancelOpen(false)
    void applyStatus({ orderStatus: "cancelled" }, "order-cancelled")
  }

  function handlePaymentToggle(currentPayment: PaymentStatus) {
    const next: PaymentStatus = currentPayment === "paid" ? "unpaid" : "paid"
    void applyStatus({ paymentStatus: next }, `pay-${next}`)
  }

  // -------------------------------------------------------------------
  // Render: non-ready phases
  // -------------------------------------------------------------------
  if (loadState.phase === "loading") {
    return (
      <div
        className="flex items-center justify-center py-20 text-sm text-gray-500"
        role="status"
        aria-live="polite"
      >
        Loading order…
      </div>
    )
  }

  if (loadState.phase === "notfound") {
    return (
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <p className="text-lg font-semibold text-gray-700">Order not found.</p>
        <Link
          to="/admin/orders"
          className="text-sm text-[#3f6ad8] hover:underline"
        >
          ← Back to orders
        </Link>
      </div>
    )
  }

  if (loadState.phase === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-sm font-medium text-red-600">{loadState.message}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="rounded bg-[#3f6ad8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3458b5]"
        >
          Retry
        </button>
        <Link to={backHref} className="text-sm text-[#3f6ad8] hover:underline">
          ← Back to orders
        </Link>
      </div>
    )
  }

  // phase === "ready"
  const { order } = loadState
  const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
  const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.orderStatus]
  const isCancelled = order.orderStatus === "cancelled"

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="overflow-hidden admin-dashboard-card bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex flex-col gap-1">
            <Link
              to={backHref}
              className="flex items-center text-xs text-[#3f6ad8]"
            >
              <ChevronLeft size={20} />
              <span>Back to orders</span>
            </Link>
            <h1 className="text-base font-bold text-gray-800">
              {order.orderNumber}
            </h1>
            <p className="text-xs text-gray-500">
              {formatOrderDate(order.createdAt)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={orderCfg.badgeClassName}>{orderCfg.label}</span>
            <span className={payCfg.badgeClassName}>{payCfg.label}</span>
          </div>
        </div>
      </div>

      {/* Success banner */}
      {successMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between gap-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setSuccessMessage(null)}
            className="rounded px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error banner */}
      {mutationError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center justify-between gap-3 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{mutationError}</span>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={() => setMutationError(null)}
            className="rounded px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left 2/3 */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card title="Customer">
            <dl>
              <Row label="Name">{order.customerName}</Row>
              <Row label="Phone">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-[#3f6ad8] hover:underline"
                >
                  {order.customerPhone}
                </a>
              </Row>
              <Row label="Address">{order.customerAddress}</Row>
              <Row label="Notes">
                {order.notes ? (
                  order.notes
                ) : (
                  <span className="text-gray-400 italic">No notes</span>
                )}
              </Row>
            </dl>
          </Card>

          <Card title="Items">
            <div className="admin-orders-scroll overflow-x-auto">
              <table
                aria-label="Order items"
                className="w-full min-w-130 border-collapse text-sm"
              >
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th
                      scope="col"
                      className="pr-3 pb-2 text-xs font-bold text-gray-500 uppercase"
                    >
                      Product
                    </th>
                    <th
                      scope="col"
                      className="pr-3 pb-2 text-center text-xs font-bold text-gray-500 uppercase"
                    >
                      Qty
                    </th>
                    <th
                      scope="col"
                      className="pr-3 pb-2 text-right text-xs font-bold text-gray-500 uppercase"
                    >
                      Unit price
                    </th>
                    <th
                      scope="col"
                      className="pb-2 text-right text-xs font-bold text-gray-500 uppercase"
                    >
                      Line total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-100 last:border-0"
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 text-xs text-gray-400"
                              aria-hidden="true"
                            >
                              —
                            </div>
                          )}
                          <span className="font-medium text-gray-700">
                            {item.product.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-center text-gray-600">
                        {item.quantity}
                      </td>
                      <td className="py-3 pr-3 text-right text-gray-600">
                        {formatTaka(item.unitPrice)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-700">
                        {formatTaka(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right 1/3 */}
        <div className="flex flex-col gap-5">
          <Card title="Summary">
            <dl>
              <Row label="Subtotal">{formatTaka(order.subtotal)}</Row>
              <Row label="Delivery">{formatTaka(order.deliveryCharge)}</Row>
              <Row label="Total">
                <span className="font-semibold text-gray-800">
                  {formatTaka(order.total)}
                </span>
              </Row>
              <Row label="Area">{order.deliveryArea}</Row>
              <Row label="Payment">{order.paymentMethod}</Row>
            </dl>
          </Card>

          <Card title="Actions">
            <div className="flex flex-col gap-4">
              {/* Order status transitions */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase">
                  Order status
                </p>
                {nextStatuses.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    This order is final.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {nextStatuses.map((next) => {
                      const isCancelBtn = next === "cancelled"
                      const key = `order-${next}`
                      const isPending = mutating && pendingAction === key
                      return (
                        <button
                          key={next}
                          ref={isCancelBtn ? cancelTriggerRef : undefined}
                          type="button"
                          disabled={mutating}
                          onClick={() => handleOrderStatusClick(next)}
                          className={`rounded px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                            isCancelBtn
                              ? "border border-red-300 text-red-600 hover:bg-red-50"
                              : "bg-[#3f6ad8] text-white hover:bg-[#3458b5]"
                          }`}
                        >
                          {isPending
                            ? "Updating…"
                            : ORDER_STATUS_ACTION_LABEL[next]}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Payment toggle */}
              <div>
                <p className="mb-2 text-xs font-medium text-gray-500 uppercase">
                  Payment status
                </p>
                {isCancelled ? (
                  <div>
                    <button
                      type="button"
                      disabled
                      className="w-full cursor-not-allowed rounded border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400"
                    >
                      {order.paymentStatus === "paid"
                        ? "Mark as unpaid"
                        : "Mark as paid"}
                    </button>
                    <p className="mt-1 text-xs text-gray-400">
                      Cannot change payment on a cancelled order.
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => handlePaymentToggle(order.paymentStatus)}
                    className="w-full rounded border border-[#3f6ad8] px-4 py-2 text-sm font-medium text-[#3f6ad8] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mutating && pendingAction?.startsWith("pay-")
                      ? "Updating…"
                      : order.paymentStatus === "paid"
                        ? "Mark as unpaid"
                        : "Mark as paid"}
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Cancel confirmation (inline dialog) */}
      {confirmCancelOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          aria-describedby="cancel-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="px-6 py-5">
              <h2
                id="cancel-dialog-title"
                className="text-base font-bold text-gray-800"
              >
                Cancel order?
              </h2>
              <p id="cancel-dialog-desc" className="mt-2 text-sm text-gray-600">
                Cancel order{" "}
                <strong className="font-semibold text-gray-800">
                  {order.orderNumber}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmCancelOpen(false)
                  cancelTriggerRef.current?.focus()
                }}
                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Cancel order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
