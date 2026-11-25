import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  User,
  MapPin,
  Phone,
  NotebookPen,
} from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { OrderItemsPicker } from "./OrderItemsPicker"
import { PricingCard } from "./PricingCard"
import { OrderDetailsCard } from "./OrderDetailsCard"
import { ApiError } from "../../api/client"
import { ordersApi, orderQueryKeys } from "../../api/ordersApi"
import {
  superAdminOrdersApi,
  superAdminOrderQueryKeys,
} from "../../api/superAdminOrdersApi"
import { productsApi, productQueryKeys } from "../../api/productsApi"
import { superAdminProductsApi } from "../../api/superAdminProductsApi"
import { courierApi } from "../../api/courierApi"
import { shopUsersApi, shopUserQueryKeys } from "../../api/shopUsersApi"
import { superAdminApi } from "../../api/superAdminApi"
import {
  COURIER_SERVICES,
  DEFAULT_SHIPPING_ZONES,
  ORDER_SOURCES,
  buildShippingZones,
} from "../../constants/orderCreate"
import { ErrorState } from "../common/ErrorState"
import { InlineNotice } from "../common/InlineNotice"
import { LoadingState } from "../common/LoadingState"
import { getErrorMessage } from "../../lib/errors"
import { SIDEBAR_STATS_QUERY_KEY } from "../../hooks/useSidebarStats"
import { useAuth } from "../../auth/AuthProvider"
import type {
  CreateOrderItem,
  CreateOrderPayload,
  PickerProduct,
  TeamMember,
} from "../../types/order"

type CreateOrderFormProps = {
  cancelHref: string
  shopId?: number | null
  variant?: "standalone" | "embedded"
}

type CreateOrderField =
  | "customerName"
  | "customerPhone"
  | "customerAddress"
  | "items"
  | "shippingZoneId"
  | "discount"
  | "advance"
  | "assignedToId"

export function CreateOrderForm({
  cancelHref,
  shopId,
  variant = "standalone",
}: CreateOrderFormProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { state: authState } = useAuth()
  const isStandalone = variant === "standalone"
  const currentUser =
    authState.status === "authenticated" ? authState.user : null

  // Customer info
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")

  // Items
  const [items, setItems] = useState<CreateOrderItem[]>([])

  // Pricing
  const [shippingZoneId, setShippingZoneId] = useState("")
  const [advance, setAdvance] = useState(0)
  const [discount, setDiscount] = useState(0)

  // Details — an empty assignee means "Unassigned" for platform orders.
  const [assignTo, setAssignTo] = useState("")
  const [courier, setCourier] = useState("")
  const [source, setSource] = useState("whatsapp")

  // Notes
  const [adminNote, setAdminNote] = useState("")
  const [courierNote, setCourierNote] = useState("")

  const [errors, setErrors] = useState<Partial<Record<CreateOrderField, string>>>(
    {}
  )
  const [submitError, setSubmitError] = useState<string | null>(null)

  const hasShop = shopId !== null && shopId !== undefined
  const selectedShopId = shopId ?? 0

  const shopProductsQuery = useQuery({
    queryKey: productQueryKeys.list(),
    queryFn: ({ signal }) => productsApi.list(signal),
    enabled: isStandalone,
  })
  const courierQuery = useQuery({
    queryKey: ["admin", "settings", "courier"],
    queryFn: ({ signal }) => courierApi.get(signal),
    enabled: isStandalone,
  })
  // Non-admin staff cannot access /shop/users — only shop admins need the roster.
  const shopUsersQuery = useQuery({
    queryKey: [...shopUserQueryKeys.list(), "assignable"],
    queryFn: ({ signal }) => shopUsersApi.list(signal),
    enabled: isStandalone && currentUser?.role === "shop_admin",
  })

  const superProductsQuery = useQuery({
    queryKey: ["admin", "super", "products", "order-create", selectedShopId],
    queryFn: ({ signal }) =>
      superAdminProductsApi.list(
        { shopId: selectedShopId, status: "active" },
        signal
      ),
    enabled: !isStandalone && hasShop,
  })
  const superUsersQuery = useQuery({
    queryKey: ["admin", "super", "users", "order-create", selectedShopId],
    queryFn: ({ signal }) =>
      superAdminApi.users.list(
        { shopId: selectedShopId, status: "active", limit: 100 },
        signal
      ),
    enabled: !isStandalone && hasShop,
  })

  const productsQuery = isStandalone ? shopProductsQuery : superProductsQuery
  const dataPending =
    isStandalone && currentUser?.role === "shop_admin"
      ? productsQuery.isPending || courierQuery.isPending || shopUsersQuery.isPending
      : productsQuery.isPending || (!isStandalone && hasShop && superUsersQuery.isPending)

  const pickerProducts = useMemo<PickerProduct[]>(() => {
    return (productsQuery.data ?? [])
      .filter((product) => product.isActive && !product.isBlocked)
      .map((product) => ({
        id: product.id,
        name: product.name,
        price: product.currentPrice,
        image: product.images?.[0] ?? null,
        sku: product.sku ?? "",
        stockQuantity: product.stockQuantity,
        inStock: product.inStock ?? product.stockQuantity > 0,
      }))
  }, [productsQuery.data])

  const shippingZones = useMemo(
    () => (isStandalone ? buildShippingZones(courierQuery.data) : DEFAULT_SHIPPING_ZONES),
    [isStandalone, courierQuery.data]
  )

  const teamMembers = useMemo<TeamMember[]>(() => {
    if (!isStandalone) {
      return (superUsersQuery.data?.items ?? []).map((user) => ({
        id: user.id,
        name: user.name,
        role: user.roleDisplayName || user.role,
      }))
    }
    if (currentUser?.role === "shop_admin" && shopUsersQuery.data) {
      return shopUsersQuery.data.items
        .filter((user) => user.status === "active")
        .map((user) => ({
          id: user.id,
          name: user.name,
          role: user.roleDisplayName || user.role,
        }))
    }
    return currentUser
      ? [
          {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.roleDisplayName || currentUser.role,
          },
        ]
      : []
  }, [
    isStandalone,
    currentUser,
    shopUsersQuery.data,
    superUsersQuery.data,
  ])

  useEffect(() => {
    if (!isStandalone) {
      setItems([])
      setAssignTo("")
      setShippingZoneId("")
    }
  }, [isStandalone, shopId])

  useEffect(() => {
    if (isStandalone && currentUser) {
      setAssignTo((current) => (current === "" ? String(currentUser.id) : current))
    }
  }, [isStandalone, currentUser])

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  const createMutation = useMutation({
    mutationFn: (body: CreateOrderPayload) =>
      isStandalone
        ? ordersApi.create(body)
        : superAdminOrdersApi.create(body),
    onSuccess: async (created) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: isStandalone
            ? orderQueryKeys.lists()
            : superAdminOrderQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({ queryKey: SIDEBAR_STATS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: productQueryKeys.list() }),
      ])
      navigate(`${cancelHref}/${created.id}`)
    },
  })

  function clearError(field: CreateOrderField) {
    setErrors((previous) => ({ ...previous, [field]: undefined }))
  }

  async function handleSubmit() {
    const nextErrors: Partial<Record<CreateOrderField, string>> = {}

    if (!customerName.trim()) nextErrors.customerName = "Name is required"
    if (!/^01[3-9]\d{8}$/.test(customerPhone.trim())) {
      nextErrors.customerPhone = "Enter a valid BD phone (01XXXXXXXXX)"
    }
    if (!customerAddress.trim()) nextErrors.customerAddress = "Address is required"
    if (items.length === 0) nextErrors.items = "Add at least one product"
    if (!shippingZoneId) nextErrors.shippingZoneId = "Select a shipping zone"
    if (discount < 0) nextErrors.discount = "Discount cannot be negative"
    if (advance < 0) nextErrors.advance = "Advance cannot be negative"

    setErrors(nextErrors)
    setSubmitError(null)
    if (Object.keys(nextErrors).length > 0) return

    const payload: CreateOrderPayload = {
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      shippingZoneId,
      advance,
      discount,
      assignedToId: assignTo === "" ? null : Number(assignTo),
      courier: courier || null,
      source,
      adminNote: adminNote.trim() || null,
      courierNote: courierNote.trim() || null,
      ...(!isStandalone && hasShop ? { shopId } : {}),
    }

    try {
      await createMutation.mutateAsync(payload)
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        setErrors((previous) => ({
          ...previous,
          ...(error.fieldErrors ?? {}),
        }))
        setSubmitError(error.message || "Failed to create order")
      } else {
        setSubmitError(getErrorMessage(error))
      }
    }
  }

  return (
    <div
      className={
        isStandalone ? "min-w-0 bg-(--bg-app) p-4 sm:p-6" : "min-w-0"
      }
    >
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(cancelHref)}
            className="mb-2 flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--primary)"
          >
            <ArrowLeft className="size-3" /> Back to Orders
          </button>
          <h1 className="text-xl font-bold text-(--text-primary)">
            Create Order
          </h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Add a new customer order manually
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Live Inventory
        </span>
      </div>

      {submitError && (
        <InlineNotice
          className="mb-4 flex items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          message={submitError}
          variant="error"
          ariaLive="assertive"
          dismissLabel="Dismiss error"
          onDismiss={() => setSubmitError(null)}
        />
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* Customer Information */}
          <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
            <div className="flex items-center justify-between border-b border-(--border-light) px-5 py-4">
              <div className="flex items-center gap-2">
                <User className="size-4 text-(--primary)" />
                <h2 className="text-sm font-semibold text-(--text-primary)">
                  Customer Information
                </h2>
              </div>
              <span className="text-[11px] text-(--text-muted)">
                Bangladesh Delivery
              </span>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                    Name <span className="text-(--primary)">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      clearError("customerName")
                    }}
                    placeholder="Customer name"
                    className={`h-10 w-full rounded-md border bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--primary)/20 ${
                      errors.customerName
                        ? "border-red-300 focus:border-red-500"
                        : "border-(--border-light) focus:border-(--primary)"
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                    Phone <span className="text-(--primary)">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--text-muted)" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value)
                        clearError("customerPhone")
                      }}
                      placeholder="01XXXXXXXXX"
                      className={`h-10 w-full rounded-md border bg-(--bg-surface) pr-3 pl-10 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--primary)/20 ${
                        errors.customerPhone
                          ? "border-red-300 focus:border-red-500"
                          : "border-(--border-light) focus:border-(--primary)"
                      }`}
                    />
                  </div>
                  {errors.customerPhone && (
                    <p className="mt-1 text-[11px] text-red-600">
                      {errors.customerPhone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                  Address <span className="text-(--primary)">*</span>
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--text-muted)" />
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => {
                      setCustomerAddress(e.target.value)
                      clearError("customerAddress")
                    }}
                    placeholder="House, road, area"
                    className={`h-10 w-full rounded-md border bg-(--bg-surface) pr-3 pl-10 text-sm text-(--text-primary) outline-none focus:ring-2 focus:ring-(--primary)/20 ${
                      errors.customerAddress
                        ? "border-red-300 focus:border-red-500"
                        : "border-(--border-light) focus:border-(--primary)"
                    }`}
                  />
                </div>
                {errors.customerAddress && (
                  <p className="mt-1 text-[11px] text-red-600">
                    {errors.customerAddress}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="inline-flex items-center gap-1.5 rounded-md border border-(--primary)/30 bg-(--primary-soft) px-3 py-1.5 text-xs font-medium text-(--primary) opacity-60"
                >
                  <Clock className="size-3.5" />
                  Order History
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 opacity-60"
                >
                  <ShieldAlert className="size-3.5" />
                  Fraud Check
                </button>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <div>
            {productsQuery.isError ? (
              <ErrorState
                message={getErrorMessage(
                  productsQuery.error,
                  "Could not load products."
                )}
                onRetry={() => void productsQuery.refetch()}
                className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-6 text-center"
                messageClassName="text-sm text-red-600"
                buttonClassName="admin-template-button admin-template-button--primary mt-3"
              />
            ) : dataPending ? (
              <LoadingState
                className="flex min-h-40 items-center justify-center rounded-lg border border-(--border-light) bg-(--bg-surface) text-sm text-(--text-muted)"
                ariaLive="polite"
              >
                Loading products and order options…
              </LoadingState>
            ) : (
              <>
                <OrderItemsPicker
                  products={pickerProducts}
                  items={items}
                  onChange={(next) => {
                    setItems(next)
                    clearError("items")
                  }}
                />
                {errors.items && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.items}</p>
                )}
              </>
            )}
          </div>

          {/* Notes */}
          <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
            <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-4">
              <NotebookPen className="size-4 text-(--primary)" />
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Notes
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                  Admin Note
                </label>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Internal note for the team"
                  className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
                  Courier Note
                </label>
                <textarea
                  rows={3}
                  value={courierNote}
                  onChange={(e) => setCourierNote(e.target.value)}
                  placeholder="Note for the courier"
                  className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4">
          <PricingCard
            shippingZones={shippingZones}
            shippingZoneId={shippingZoneId}
            onShippingChange={(id) => {
              setShippingZoneId(id)
              clearError("shippingZoneId")
            }}
            advance={advance}
            onAdvanceChange={(value) => {
              setAdvance(value)
              clearError("advance")
            }}
            discount={discount}
            onDiscountChange={(value) => {
              setDiscount(value)
              clearError("discount")
            }}
            subtotal={subtotal}
          />
          {errors.shippingZoneId && (
            <p className="-mt-2 text-[11px] text-red-600">
              {errors.shippingZoneId}
            </p>
          )}
          {errors.discount && (
            <p className="-mt-2 text-[11px] text-red-600">{errors.discount}</p>
          )}
          {errors.advance && (
            <p className="-mt-2 text-[11px] text-red-600">{errors.advance}</p>
          )}

          <OrderDetailsCard
            teamMembers={teamMembers}
            assignTo={assignTo}
            onAssignToChange={(id) => {
              setAssignTo(id)
              clearError("assignedToId")
            }}
            allowUnassigned={!isStandalone}
            couriers={COURIER_SERVICES}
            courier={courier}
            onCourierChange={setCourier}
            sources={ORDER_SOURCES}
            source={source}
            onSourceChange={setSource}
          />
          {errors.assignedToId && (
            <p className="-mt-2 text-[11px] text-red-600">
              {errors.assignedToId}
            </p>
          )}

          <button
            type="button"
            disabled={createMutation.isPending}
            onClick={() => void handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-(--primary) px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CheckCircle2 className="size-4" />
            {createMutation.isPending ? "Creating order…" : "Create Order"}
          </button>
          <p className="text-center text-[11px] text-(--text-muted)">
            Inventory will be immediately reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
