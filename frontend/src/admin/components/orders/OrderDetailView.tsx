import { useRef, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import DataTable, {
  type TableColumn,
  type TableStyles,
} from "react-data-table-component"
import { ApiError } from "../../api/client"
import type {
  CourierShipmentSummary,
  OrderDetail,
  OrderItemDetail,
  OrderStatus,
  PaymentStatus,
  UpdateStatusBody,
} from "../../types/order"
import type { CourierSlug } from "../../types/courier"
import {
  ORDER_STATUS_CONFIG,
  ORDER_STATUS_ACTION_LABEL,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_CONFIG,
  formatOrderDate,
  formatTaka,
} from "../../lib/orderStatus"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Printer,
  RotateCcw,
  Truck,
  UserRound,
  XCircle,
} from "lucide-react"
import { ErrorState } from "../common/ErrorState"
import { InlineNotice } from "../common/InlineNotice"
import { LoadingState } from "../common/LoadingState"
import { NotFoundState } from "../common/NotFoundState"
import { StatusBadge } from "../common/StatusBadge"
import { ConfirmationDialog } from "../common/ConfirmationDialog"
import {
  COURIER_LABELS,
  DispatchCourierModal,
  type DispatchTarget,
} from "./DispatchCourierModal"
import { getErrorMessage } from "../../lib/errors"
import React from "react"
import { useAuth } from "../../auth/AuthProvider"
import { can, canAny } from "../../lib/permissions"

type OrderDetailQueryKeys = {
  detail: (id: string) => readonly unknown[]
  lists: () => readonly unknown[]
  stats?: () => readonly unknown[]
}

/** The two order detail screens differ only by data source and a few flags. */
export type OrderDetailViewConfig = {
  api: {
    get(id: string, signal: AbortSignal): Promise<OrderDetail>
    updateStatus(id: string, body: UpdateStatusBody): Promise<OrderDetail>
  }
  queryKeys: OrderDetailQueryKeys
  basePath: string
  showShopName?: boolean
  invalidateStats?: boolean
  courierDispatchEnabled?: boolean
}

function getBackHref(locationState: unknown, basePath: string): string {
  if (
    typeof locationState === "object" &&
    locationState !== null &&
    "q" in locationState &&
    typeof (locationState as Record<string, unknown>).q === "string"
  ) {
    const qs = (locationState as Record<string, string>).q
    return qs ? `${basePath}?${qs}` : basePath
  }
  return basePath
}

function getPaymentMethodLabel(method: string): string {
  if (method.toLowerCase() === "cod") return "Cash on delivery"
  return method
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function getCourierLabel(slug: string): string {
  const labels = COURIER_LABELS as Record<string, string>
  return (
    labels[slug] ??
    slug
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

function toCourierSlug(value: string | null | undefined): CourierSlug | null {
  if (!value) return null
  const labels = COURIER_LABELS as Record<string, string>
  return value in labels ? (value as CourierSlug) : null
}

/* ------------------------------------------------------------------ */
/*  Order items table                                                  */
/* ------------------------------------------------------------------ */

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

const orderItemTableStyles: TableStyles = {
  ...adminDataTableStyles,
  headRow: {
    style: {
      ...adminDataTableStyles.headRow?.style,
      minHeight: "40px",
    },
  },
  rows: {
    style: {
      ...adminDataTableStyles.rows?.style,
      minHeight: "60px",
      borderBottom: "none",
    },
  },
}

/* ------------------------------------------------------------------ */
/*  Small reusable pieces                                              */
/* ------------------------------------------------------------------ */

function Card({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
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

/* ------------------------------------------------------------------ */
/*  Status stepper — visual progress indicator                         */
/* ------------------------------------------------------------------ */

const STEPPER_STEPS: { key: OrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
]

function OrderStatusStepper({ current }: { current: OrderStatus }) {
  if (current === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">
        <XCircle className="size-4" aria-hidden="true" />
        This order was cancelled
      </div>
    )
  }

  if (current === "returned") {
    return (
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800">
        <RotateCcw className="size-4" aria-hidden="true" />
        This order was returned
      </div>
    )
  }

  const currentIndex = STEPPER_STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex w-full items-end justify-between">
      {STEPPER_STEPS.map((step, index) => {
        const isComplete = index < currentIndex
        const isCurrent = index === currentIndex
        const isUpcoming = index > currentIndex

        return (
          <React.Fragment key={step.key}>
            {/* প্রতিটি স্টেপ: লেবেল উপরে এবং সার্কেল তার ঠিক নিচে */}
            <div className="flex flex-col items-center">
              {/* লেবেল */}
              <div className="mb-2 flex h-5 items-center justify-center">
                <span
                  className={`text-center text-xs font-medium whitespace-nowrap ${
                    isCurrent ? "text-(--text-primary)" : "text-(--text-muted)"
                  } ${isUpcoming ? "opacity-50" : ""}`}
                >
                  {step.label}
                </span>
              </div>

              {/* সার্কেল */}
              <div
                className={`z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-primary text-white"
                      : "bg-(--bg-table-header) text-(--text-muted)"
                } ${isUpcoming ? "opacity-50" : ""}`}
              >
                {isComplete ? <Check className="size-3" /> : index + 1}
              </div>
            </div>

            {/* কানেক্টিং লাইন (শেষ স্টেপ বাদে) */}
            {index < STEPPER_STEPS.length - 1 && (
              <div
                className={`-mx-3.5 mb-2.5 h-0.5 flex-1 sm:-mx-6.5 ${
                  index < currentIndex
                    ? "bg-emerald-500"
                    : "bg-(--border-light)"
                }`}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */

export function OrderDetailView({
  api,
  queryKeys,
  basePath,
  showShopName = false,
  invalidateStats = false,
  courierDispatchEnabled = false,
}: OrderDetailViewConfig) {
  const { state } = useAuth()
  const user = state.status === "authenticated" ? state.user : null
  const canUpdateOrder = can(user, "orders", "update")
  const canDispatchCourier = canAny(user, [
    ["orders", "update"],
    ["courier", "update"],
  ])
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const backHref = getBackHref(location.state, basePath)

  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [confirmTarget, setConfirmTarget] = useState<
    "cancelled" | "returned" | null
  >(null)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [dispatchInitialSlug, setDispatchInitialSlug] =
    useState<CourierSlug | null>(null)
  const [copiedTrackingValue, setCopiedTrackingValue] = useState<string | null>(
    null
  )
  const [dismissedFailureId, setDismissedFailureId] = useState<number | null>(
    null
  )
  const cancelTriggerRef = useRef<HTMLButtonElement>(null)

  const orderQuery = useQuery({
    queryKey: queryKeys.detail(id ?? ""),
    enabled: Boolean(id),
    queryFn: ({ signal }) => {
      if (!id) throw new Error("Order ID is required.")
      return api.get(id, signal)
    },
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    retry: (failureCount, error) =>
      !(error instanceof ApiError && error.status >= 400) && failureCount < 2,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({
      orderId,
      body,
    }: {
      orderId: string
      body: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus }
    }) => api.updateStatus(orderId, body),
    onSuccess: async (updated, { orderId }) => {
      queryClient.setQueryData(queryKeys.detail(orderId), updated)
      const invalidations = [
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() }),
      ]
      if (invalidateStats && queryKeys.stats) {
        invalidations.push(
          queryClient.invalidateQueries({ queryKey: queryKeys.stats() })
        )
      }
      await Promise.all(invalidations)
    },
  })
  const mutating = updateStatusMutation.isPending

  async function applyStatus(
    body: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus },
    actionKey: string
  ) {
    if (!canUpdateOrder) return
    if (!id || mutating) return
    setPendingAction(actionKey)
    setMutationError(null)
    setSuccessMessage(null)
    try {
      const updated = await updateStatusMutation.mutateAsync({
        orderId: id,
        body,
      })

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
        await queryClient.invalidateQueries({
          queryKey: queryKeys.detail(id),
          exact: true,
        })
      } else {
        setMutationError(getErrorMessage(err))
      }
    } finally {
      setPendingAction(null)
    }
  }

  function handleOrderStatusClick(next: OrderStatus) {
    if (next === "cancelled" || next === "returned") {
      setConfirmTarget(next)
    } else {
      void applyStatus({ orderStatus: next }, `order-${next}`)
    }
  }

  function handleConfirmIrreversibleStatus() {
    if (!confirmTarget) return
    const target = confirmTarget
    setConfirmTarget(null)
    void applyStatus({ orderStatus: target }, `order-${target}`)
  }

  // function handleConfirmCancel() {
  //   setConfirmTarget(false)
  //   void applyStatus({ orderStatus: "cancelled" }, "order-cancelled")
  // }

  function handlePaymentToggle(currentPayment: PaymentStatus) {
    const next: PaymentStatus = currentPayment === "paid" ? "unpaid" : "paid"
    void applyStatus({ paymentStatus: next }, `pay-${next}`)
  }

  /* ---------------- Non-ready phases ---------------- */

  if (!id) {
    return (
      <NotFoundState
        title="Order not found."
        backTo={basePath}
        backLabel="Back to orders"
        className="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center"
        titleClassName="text-lg font-semibold text-(--text-primary)"
        linkClassName="text-sm font-medium text-(--primary) hover:underline"
      />
    )
  }

  if (orderQuery.isPending) {
    return (
      <LoadingState
        className="flex min-h-80 items-center justify-center p-6 text-sm text-(--text-muted)"
        aria-live="polite"
      >
        Loading order…
      </LoadingState>
    )
  }

  if (
    orderQuery.isError &&
    orderQuery.error instanceof ApiError &&
    orderQuery.error.status === 404
  ) {
    return (
      <NotFoundState
        title="Order not found."
        backTo={basePath}
        backLabel="Back to orders"
        className="flex min-h-80 flex-col items-center justify-center gap-4 p-6 text-center"
        titleClassName="text-lg font-semibold text-(--text-primary)"
        linkClassName="text-sm font-medium text-(--primary) hover:underline"
      />
    )
  }

  if (orderQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(orderQuery.error)}
        onRetry={() => void orderQuery.refetch()}
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

  /* ---------------- Ready phase ---------------- */

  const order = orderQuery.data
  if (!order) {
    return (
      <ErrorState
        message="Order data is unavailable."
        onRetry={() =>
          void queryClient.invalidateQueries({
            queryKey: queryKeys.detail(id),
            exact: true,
          })
        }
        className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center"
        messageClassName="text-sm font-medium text-red-600"
        buttonClassName="admin-template-button admin-template-button--primary"
      />
    )
  }
  const orderCfg = ORDER_STATUS_CONFIG[order.orderStatus]
  const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus]
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.orderStatus]
  const isCancelled = order.orderStatus === "cancelled"
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0
  )

  // Clean phone number for tel: / wa.me links
  const phoneDigits = order.customerPhone.replace(/[^0-9]/g, "")
  const waLink = `https://wa.me/88${phoneDigits}`

  const shipments: CourierShipmentSummary[] = order.shipments ?? []
  const latestShipment = shipments[0] ?? null
  const trackingNumber =
    latestShipment?.trackingCode ?? latestShipment?.consignmentId ?? null
  const hasActiveShipment = Boolean(
    latestShipment?.consignmentId || latestShipment?.trackingCode
  )
  const failureNotice =
    latestShipment?.errorMessage && latestShipment.id !== dismissedFailureId
      ? latestShipment
      : null
  const copied = trackingNumber !== null && copiedTrackingValue === trackingNumber
  const dispatchTarget: DispatchTarget = {
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    advance: order.advance,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
  }

  async function handleCopyTracking() {
    if (!trackingNumber) return
    try {
      await navigator.clipboard.writeText(trackingNumber)
      setCopiedTrackingValue(trackingNumber)
    } catch {
      setCopiedTrackingValue(null)
    }
  }

  function openCourierDispatch() {
    setDispatchInitialSlug(toCourierSlug(order.courier))
    setDispatchOpen(true)
  }

  async function handleCourierDispatched() {
    if (!id) return
    const invalidations = [
      queryClient.invalidateQueries({
        queryKey: queryKeys.detail(id),
        exact: true,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() }),
    ]
    if (invalidateStats && queryKeys.stats) {
      invalidations.push(
        queryClient.invalidateQueries({ queryKey: queryKeys.stats() })
      )
    }
    await Promise.all(invalidations)
  }

  return (
    <div className="min-w-0 space-y-5 bg-(--bg-app) p-4 sm:p-6">
      <Link
        to={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-(--text-muted) transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to orders
      </Link>

      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-(--text-primary)">
              {order.orderNumber}
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
          {showShopName && order.shopName && (
            <span className="inline-flex items-center gap-1 rounded-md bg-(--bg-table-header) px-2 py-0.5 text-xs font-medium text-(--text-primary)">
              🏪 {order.shopName}
            </span>
          )}
          <p className="mt-1 text-sm text-(--text-muted)">
            Placed on {formatOrderDate(order.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void navigate(`${basePath}/invoice?ids=${id}`)}
          className="admin-template-button admin-template-button--secondary self-start"
        >
          <Printer className="icon-size" aria-hidden="true" />
          Print order
        </button>
      </header>

      {/* Status stepper */}
      <div className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
        <p className="mb-3 text-xs font-semibold tracking-wide text-(--text-muted) uppercase">
          Order progress
        </p>
        <OrderStatusStepper current={order.orderStatus} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <article className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
          <p className="text-xs font-medium text-(--text-muted)">Order total</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
            {formatTaka(order.total)}
          </p>
        </article>
        <article className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
          <p className="text-xs font-medium text-(--text-muted)">Items</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary) tabular-nums">
            {itemCount}
            <span className="ml-1 text-sm font-medium text-(--text-muted)">
              {itemCount === 1 ? "item" : "items"}
            </span>
          </p>
        </article>
        <article className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
          <p className="text-xs font-medium text-(--text-muted)">Payment</p>
          <p className="mt-1 text-xl font-bold text-(--text-primary)">
            {payCfg.label}
          </p>
        </article>
      </div>

      {/* Success / Error banners */}
      {successMessage && (
        <InlineNotice
          className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          message={successMessage}
          variant="success"
          ariaLive="polite"
          dismissLabel="Dismiss"
          dismissText="✕"
          dismissClassName="rounded px-2 py-0.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
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
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card title="Customer & delivery">
            {/* Customer card with Call / WhatsApp quick actions */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-primary">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-(--text-primary)">
                    {order.customerName}
                  </p>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="mt-0.5 inline-block text-sm text-primary tabular-nums hover:underline"
                  >
                    {order.customerPhone}
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="inline-flex items-center gap-1.5 rounded-md border border-(--border-light) bg-white px-2.5 py-1.5 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                  title="Call customer"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  Call
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                  title="WhatsApp customer"
                >
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  WhatsApp
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

          <Card title="Order items">
            <DataTable
              className="admin-data-table"
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
        </div>

        {/* Right column */}
        <aside className="flex flex-col gap-5">
          <Card title="Payment summary">
            <dl className="divide-y divide-(--border-light)">
              <Row label="Subtotal">{formatTaka(order.subtotal)}</Row>
              <Row label="Delivery">{formatTaka(order.deliveryCharge)}</Row>
              <Row label="Discount">
                {formatTaka(order.discount ?? 0)}
              </Row>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-sm font-semibold text-(--text-primary)">
                  Total
                </dt>
                <dd className="text-lg font-bold text-primary tabular-nums">
                  {formatTaka(order.total)}
                </dd>
              </div>
              <Row label="Advance paid">
                {formatTaka(order.advance ?? 0)}
              </Row>
              <div className="flex items-center justify-between gap-3 py-3">
                <dt className="text-sm font-semibold text-(--text-primary)">
                  Amount to collect
                </dt>
                <dd className="text-lg font-bold text-primary tabular-nums">
                  {formatTaka(
                    order.dueAmount ??
                      Math.max(0, order.total - (order.advance ?? 0))
                  )}
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

          {courierDispatchEnabled ? (
            <Card title="Courier & tracking">
              {latestShipment ? (
                <dl className="divide-y divide-(--border-light)">
                  <Row label="Courier">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {getCourierLabel(latestShipment.courierSlug)}
                      {latestShipment.isSandbox ? (
                        <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-semibold text-(--text-muted)">
                          Sandbox
                        </span>
                      ) : null}
                    </span>
                  </Row>
                  <Row label="Tracking">
                    {trackingNumber ? (
                      <span className="inline-flex flex-wrap items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleCopyTracking()}
                          className="inline-flex items-center gap-1 rounded-md border border-(--border-light) bg-white px-2 py-0.5 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                        >
                          <Copy className="size-3" aria-hidden="true" />
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </span>
                    ) : (
                      <span className="text-(--text-muted)">—</span>
                    )}
                  </Row>
                  <Row label="Courier status">
                    {latestShipment.courierStatus || (
                      <span className="text-(--text-muted)">—</span>
                    )}
                  </Row>
                  <Row label="Delivery fee">
                    {latestShipment.deliveryFee !== null ? (
                      <span className="tabular-nums">
                        {formatTaka(latestShipment.deliveryFee)}
                      </span>
                    ) : (
                      <span className="text-(--text-muted)">—</span>
                    )}
                  </Row>
                  <Row label="Area">
                    {latestShipment.areaName || (
                      <span className="text-(--text-muted)">—</span>
                    )}
                  </Row>
                  <Row label="Dispatched">
                    {latestShipment.dispatchedAt ? (
                      <span className="tabular-nums">
                        {formatOrderDate(latestShipment.dispatchedAt)}
                      </span>
                    ) : (
                      <span className="text-(--text-muted)">—</span>
                    )}
                  </Row>
                </dl>
              ) : (
                <p className="text-sm text-(--text-muted)">
                  No courier shipment has been created for this order.
                </p>
              )}

              {failureNotice ? (
                <div className="mt-3">
                  <InlineNotice
                    variant="error"
                    message={`Last courier attempt failed: ${failureNotice.errorMessage}`}
                    ariaLive="polite"
                    dismissLabel="Dismiss courier error"
                    dismissText="✕"
                    onDismiss={() => setDismissedFailureId(failureNotice.id)}
                    className="flex items-start justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary)"
                    dismissClassName="rounded px-1.5 py-0.5 text-(--text-muted) hover:bg-(--bg-surface-hover)"
                  />
                </div>
              ) : null}

              {canDispatchCourier ? (
                <div className="mt-4 border-t border-(--border-light) pt-4">
                  <button
                    type="button"
                    onClick={openCourierDispatch}
                    disabled={hasActiveShipment}
                    title={
                      hasActiveShipment
                        ? "This order already has an active courier shipment."
                        : undefined
                    }
                    className="admin-template-button admin-template-button--primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Truck className="icon-size" aria-hidden="true" />
                    Send to Courier
                  </button>
                </div>
              ) : null}
            </Card>
          ) : null}

          <Card title="Order details">
            <dl className="divide-y divide-(--border-light)">
              <Row label="Source">{order.source || "—"}</Row>
              <Row label="Courier">{order.courier || "—"}</Row>
              <Row label="Courier note">
                {order.courierNote || (
                  <span className="text-(--text-muted) italic">
                    No courier note
                  </span>
                )}
              </Row>
              <Row label="Assigned to">
                {order.assignedTo?.name || "Unassigned"}
              </Row>
            </dl>
          </Card>

          {canUpdateOrder ? (
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
                      const isReturnBtn = next === "returned"
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
                              : isReturnBtn
                                ? "border border-amber-300 bg-white text-amber-800 hover:bg-amber-50"
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
          ) : null}

          <div className="flex items-start gap-3 rounded-md border border-(--border-light) bg-white p-4">
            <Clock3
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-(--text-muted)">
              Order received on {formatOrderDate(order.createdAt)}. Status
              changes are saved immediately.
            </p>
          </div>
        </aside>
      </div>

      {/* Cancel confirmation dialog */}
      <ConfirmationDialog
        open={canUpdateOrder && confirmTarget !== null}
        title={
          confirmTarget === "returned"
            ? "Mark order as returned?"
            : "Cancel order?"
        }
        variant={confirmTarget === "returned" ? "warning" : "danger"}
        icon={confirmTarget === "returned" ? RotateCcw : XCircle}
        confirmLabel={
          confirmTarget === "returned" ? "Mark as returned" : "Cancel order"
        }
        cancelLabel="Go back"
        onCancel={() => {
          const wasCancel = confirmTarget === "cancelled"
          setConfirmTarget(null)
          if (wasCancel) cancelTriggerRef.current?.focus()
        }}
        onConfirm={handleConfirmIrreversibleStatus}
        description={
          confirmTarget === "returned" ? (
            <>
              Mark order{" "}
              <strong className="font-semibold text-(--text-primary)">
                {order.orderNumber}
              </strong>{" "}
              as returned? This action cannot be undone.
            </>
          ) : (
            <>
              Cancel order{" "}
              <strong className="font-semibold text-(--text-primary)">
                {order.orderNumber}
              </strong>
              ? This action cannot be undone.
            </>
          )
        }
      />

      {courierDispatchEnabled && canDispatchCourier && dispatchOpen ? (
        <DispatchCourierModal
          open={dispatchOpen}
          targets={[dispatchTarget]}
          initialSlug={dispatchInitialSlug}
          onClose={() => setDispatchOpen(false)}
          onDispatched={handleCourierDispatched}
        />
      ) : null}
    </div>
  )
}
