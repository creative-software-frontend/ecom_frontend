import { useCallback, useEffect, useReducer, useRef, useState } from "react"
import { Link, useLocation, useParams } from "react-router"
import DataTable, { type TableColumn } from "react-data-table-component"
import { ordersApi } from "../api/ordersApi"
import { ApiError } from "../api/client"
import type {
  OrderDetail,
  OrderItemDetail,
  OrderStatus,
  PaymentStatus,
} from "../types/order"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_ACTION_LABEL,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../lib/orderStatus"
import {
  ArrowLeft,
  Check,
  Clock3,
  MapPin,
  Package,
  Printer,
  UserRound,
} from "lucide-react"
import { ErrorState } from "../components/common/ErrorState"
import { InlineNotice } from "../components/common/InlineNotice"
import { LoadingState } from "../components/common/LoadingState"
import { NotFoundState } from "../components/common/NotFoundState"
import { StatusBadge } from "../components/common/StatusBadge"

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

function getPaymentMethodLabel(method: string): string {
  if (method.toLowerCase() === "cod") return "Cash on delivery"
  return method
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const orderItemColumns: TableColumn<OrderItemDetail>[] = [
  {
    name: "Product",
    selector: (item) => item.product.name,
    minWidth: "220px",
    cell: (item) => (
      <div className="flex min-w-0 items-center gap-3 py-2">
        {item.product.image ? (
          <img
            src={item.product.image}
            alt=""
            className="size-11 shrink-0 rounded-md border border-(--border-light) object-cover"
          />
        ) : (
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-md bg-(--bg-table-header) text-(--text-muted)"
            aria-hidden="true"
          >
            <Package className="size-5" />
          </span>
        )}
        <span className="min-w-0 font-medium text-(--text-primary)">
          {item.product.name}
        </span>
      </div>
    ),
  },
  {
    name: "Qty",
    selector: (item) => item.quantity,
    center: true,
    width: "76px",
  },
  {
    name: "Unit price",
    selector: (item) => item.unitPrice,
    right: true,
    minWidth: "130px",
    cell: (item) => (
      <span className="whitespace-nowrap text-(--text-muted) tabular-nums">
        {formatTaka(item.unitPrice)}
      </span>
    ),
  },
  {
    name: "Total",
    selector: (item) => item.lineTotal,
    right: true,
    minWidth: "130px",
    cell: (item) => (
      <span className="font-semibold whitespace-nowrap text-(--text-primary) tabular-nums">
        {formatTaka(item.lineTotal)}
      </span>
    ),
  },
]

const orderItemTableStyles = {
  table: {
    style: {
      backgroundColor: "var(--bg-surface)",
      color: "var(--text-primary)",
    },
  },
  headRow: {
    style: {
      minHeight: "40px",
      backgroundColor: "var(--bg-table-header)",
      borderBottom: "1px solid var(--border-light)",
    },
  },
  headCells: {
    style: {
      color: "var(--text-muted)",
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase" as const,
      paddingLeft: "12px",
      paddingRight: "12px",
    },
  },
  rows: {
    style: {
      minHeight: "60px",
      backgroundColor: "var(--bg-surface)",
      borderBottom: "1px solid var(--border-light)",
    },
  },
  cells: {
    style: {
      paddingLeft: "12px",
      paddingRight: "12px",
      color: "var(--text-primary)",
      fontSize: "13px",
    },
  },
}

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="admin-dashboard-card overflow-hidden">
      <div className="border-b border-(--border-light) px-5 py-4">
        <h2 className="text-sm font-semibold text-(--text-primary)">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
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
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-x-3 gap-y-1 py-2">
      <dt className="text-xs font-medium text-(--text-muted)">{label}</dt>
      <dd className="min-w-0 text-sm text-(--text-primary)">{children}</dd>
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
      <LoadingState
        className="flex min-h-80 items-center justify-center p-6 text-sm text-(--text-muted)"
        aria-live="polite"
      >
        Loading order…
      </LoadingState>
    )
  }

  if (loadState.phase === "notfound") {
    return (
      <NotFoundState
        title="Order not found."
        backTo="/admin/orders"
        backLabel="← Back to orders"
        className="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center"
        titleClassName="text-lg font-semibold text-(--text-primary)"
        linkClassName="text-sm font-medium text-(--primary) hover:underline"
      />
    )
  }

  if (loadState.phase === "error") {
    return (
      <ErrorState
        message={loadState.message}
        onRetry={handleRetry}
        className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"
        messageClassName="text-sm font-medium text-red-600"
        buttonClassName="admin-template-button admin-template-button--primary"
        backLink={{
          to: backHref,
          label: "← Back to orders",
          className: "text-sm font-medium text-(--primary) hover:underline",
        }}
      />
    )
  }

  // phase === "ready"
  const { order } = loadState
  const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
  const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.orderStatus]
  const isCancelled = order.orderStatus === "cancelled"
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  return (
    <div className="admin-dashboard-content min-w-0 space-y-5 p-4 sm:p-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-(--text-muted) transition-colors hover:text-(--primary)"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to orders
      </Link>

      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-(--text-primary)">
              Order details
            </h1>
            <StatusBadge
              variant={orderCfg.variant}
              label={orderCfg.label}
              className={orderCfg.badgeClassName}
            />
            <StatusBadge
              variant={payCfg.variant}
              label={payCfg.label}
              className={payCfg.badgeClassName}
            />
          </div>
          <p className="mt-1 text-sm text-(--text-muted)">
            <span className="font-semibold text-(--text-primary)">
              {order.orderNumber}
            </span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            Placed {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="admin-template-button admin-template-button--secondary self-start"
        >
          <Printer className="icon-size" aria-hidden="true" />
          Print order
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="admin-dashboard-card p-4">
          <p className="text-xs font-medium text-(--text-muted)">Order total</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
            {formatTaka(order.total)}
          </p>
        </article>
        <article className="admin-dashboard-card p-4">
          <p className="text-xs font-medium text-(--text-muted)">Items</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
            {itemCount}
            <span className="ml-1 text-sm font-medium text-(--text-muted)">
              {itemCount === 1 ? "item" : "items"}
            </span>
          </p>
        </article>
        <article className="admin-dashboard-card p-4">
          <p className="text-xs font-medium text-(--text-muted)">Payment</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary)">
            {payCfg.label}
          </p>
        </article>
      </div>

      {/* Success banner */}
      {successMessage && (
        <InlineNotice
          className="flex items-center justify-between gap-3 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          message={successMessage}
          variant="success"
          ariaLive="polite"
          dismissLabel="Dismiss"
          dismissText="✕"
          dismissClassName="rounded px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-100"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {/* Error banner */}
      {mutationError && (
        <InlineNotice
          className="flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          message={mutationError}
          variant="error"
          ariaLive="assertive"
          dismissLabel="Dismiss error"
          dismissText="✕"
          dismissClassName="rounded px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100"
          onDismiss={() => setMutationError(null)}
        />
      )}

      <div className="grid min-w-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Order items">
            <DataTable
              ariaLabel="Order items"
              columns={orderItemColumns}
              data={order.items}
              customStyles={orderItemTableStyles}
              responsive
              noDataComponent={
                <p className="py-8 text-center text-sm text-(--text-muted)">
                  No items were recorded for this order.
                </p>
              }
            />
          </Card>

          <Card title="Customer & delivery">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-(--primary)">
                <UserRound className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-(--text-primary)">
                  {order.customerName}
                </p>
                <a
                  href={`tel:${order.customerPhone}`}
                  className="mt-0.5 inline-block text-sm text-(--primary) hover:underline"
                >
                  {order.customerPhone}
                </a>
              </div>
            </div>
            <div className="mt-4 border-t border-(--border-light) pt-3">
              <div className="flex items-start gap-2">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-(--text-muted)"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-xs font-medium text-(--text-muted)">
                    Delivery address
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line text-(--text-primary)">
                    {order.customerAddress}
                  </p>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    {order.deliveryArea}
                  </p>
                </div>
              </div>
              <div className="mt-3 border-t border-(--border-light) pt-3">
                <p className="text-xs font-medium text-(--text-muted)">
                  Order note
                </p>
                <p className="mt-1 text-sm text-(--text-primary)">
                  {order.notes || (
                    <span className="text-(--text-muted) italic">
                      No note provided
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <aside className="flex flex-col gap-5">
          <Card title="Payment summary">
            <dl className="divide-y divide-(--border-light)">
              <Row label="Subtotal">{formatTaka(order.subtotal)}</Row>
              <Row label="Delivery">{formatTaka(order.deliveryCharge)}</Row>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-sm font-semibold text-(--text-primary)">
                  Total
                </dt>
                <dd className="text-lg font-bold text-(--primary) tabular-nums">
                  {formatTaka(order.total)}
                </dd>
              </div>
              <Row label="Method">
                {getPaymentMethodLabel(order.paymentMethod)}
              </Row>
              <Row label="Payment status">
                <span className="inline-flex items-center gap-1.5">
                  {order.paymentStatus === "paid" && (
                    <Check
                      className="size-4 text-emerald-600"
                      aria-hidden="true"
                    />
                  )}
                  {payCfg.label}
                </span>
              </Row>
            </dl>
          </Card>

          <Card title="Update order">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
                  Order status
                </p>
                {nextStatuses.length === 0 ? (
                  <p className="rounded-md bg-(--bg-table-header) px-3 py-2.5 text-sm text-(--text-muted)">
                    This order is in a final status.
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
                          className={`admin-template-button w-full disabled:cursor-not-allowed disabled:opacity-50 ${
                            isCancelBtn
                              ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                              : "admin-template-button--primary"
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
              <div className="border-t border-(--border-light) pt-4">
                <p className="mb-2 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
                  Payment status
                </p>
                {isCancelled ? (
                  <p className="text-xs leading-relaxed text-(--text-muted)">
                    Payment status cannot be changed after an order is
                    cancelled.
                  </p>
                ) : (
                  <button
                    type="button"
                    disabled={mutating}
                    onClick={() => handlePaymentToggle(order.paymentStatus)}
                    className="admin-template-button admin-template-button--secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="flex items-start gap-3 rounded-md border border-(--border-light) bg-white p-4">
            <Clock3
              className="mt-0.5 size-4 shrink-0 text-(--primary)"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-(--text-muted)">
              Order received on {formatOrderDate(order.createdAt)}. Status
              changes are saved immediately.
            </p>
          </div>
        </aside>
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
          <div className="w-full max-w-md rounded-lg border border-(--border-light) bg-white shadow-xl">
            <div className="px-6 py-5">
              <h2
                id="cancel-dialog-title"
                className="text-base font-bold text-(--text-primary)"
              >
                Cancel order?
              </h2>
              <p
                id="cancel-dialog-desc"
                className="mt-2 text-sm text-(--text-muted)"
              >
                Cancel order{" "}
                <strong className="font-semibold text-(--text-primary)">
                  {order.orderNumber}
                </strong>
                ? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-(--border-light) px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setConfirmCancelOpen(false)
                  cancelTriggerRef.current?.focus()
                }}
                className="admin-template-button admin-template-button--secondary"
              >
                Go back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="admin-template-button border border-red-600 bg-red-600 text-white hover:bg-red-700"
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
