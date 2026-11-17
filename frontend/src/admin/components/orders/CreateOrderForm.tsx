import { useState } from "react"
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
import { useNavigate } from "react-router"
import { OrderItemsPicker } from "./OrderItemsPicker"
import { PricingCard } from "./PricingCard"
import { OrderDetailsCard } from "./OrderDetailsCard"
import {
  COURIER_SERVICES,
  MOCK_PICKER_PRODUCTS,
  ORDER_SOURCES,
  SHIPPING_ZONES,
  TEAM_MEMBERS,
} from "../../data/orderCreateMock"
import type { CreateOrderItem } from "../../types/order"

type CreateOrderFormProps = {
  cancelHref: string
  shopId?: number | null
  variant?: "standalone" | "embedded"
}

export function CreateOrderForm({
  cancelHref,
  shopId,
  variant = "standalone",
}: CreateOrderFormProps) {
  const navigate = useNavigate()

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

  // Details
  const [assignTo, setAssignTo] = useState("me")
  const [courier, setCourier] = useState("")
  const [source, setSource] = useState("whatsapp")

  // Notes
  const [adminNote, setAdminNote] = useState("")
  const [courierNote, setCourierNote] = useState("")

  // Validation state
  const [errors, setErrors] = useState<{
    customerName?: string
    customerPhone?: string
    customerAddress?: string
    items?: string
    shippingZoneId?: string
  }>({})

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  function handleSubmit() {
    const nextErrors: typeof errors = {}

    if (!customerName.trim()) nextErrors.customerName = "Name is required"
    if (!/^01[3-9]\d{8}$/.test(customerPhone.trim())) {
      nextErrors.customerPhone = "Enter a valid BD phone (01XXXXXXXXX)"
    }
    if (!customerAddress.trim())
      nextErrors.customerAddress = "Address is required"
    if (items.length === 0) nextErrors.items = "Add at least one product"
    if (!shippingZoneId) nextErrors.shippingZoneId = "Select a shipping zone"

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const payload = {
      customerName,
      customerPhone,
      customerAddress,
      items,
      shippingZoneId,
      advance,
      discount,
      assignTo,
      courier,
      source,
      adminNote,
      courierNote,
      ...(shopId !== undefined && shopId !== null ? { shopId } : {}),
    }
    console.log("Create Order Payload:", payload)
    alert("Order created (mock). Check console for payload.")
    navigate(cancelHref)
  }

  return (
    <div
      className={
        variant === "embedded" ? "min-w-0" : "min-w-0 bg-(--bg-app) p-4 sm:p-6"
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
          Drafting Mode
        </span>
      </div>

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
                    onChange={(e) => setCustomerName(e.target.value)}
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
                      onChange={(e) => setCustomerPhone(e.target.value)}
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
                    onChange={(e) => setCustomerAddress(e.target.value)}
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
                  onClick={() => alert("Order History — coming soon")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-(--primary)/30 bg-(--primary-soft) px-3 py-1.5 text-xs font-medium text-(--primary) transition-colors hover:bg-(--primary)/10"
                >
                  <Clock className="size-3.5" />
                  Order History
                </button>
                <button
                  type="button"
                  onClick={() => alert("Fraud Check — coming soon")}
                  className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100"
                >
                  <ShieldAlert className="size-3.5" />
                  Fraud Check
                </button>
              </div>
            </div>
          </section>

          {/* Order Items */}
          <div>
            <OrderItemsPicker
              products={MOCK_PICKER_PRODUCTS}
              items={items}
              onChange={setItems}
            />
            {errors.items && (
              <p className="mt-1 text-[11px] text-red-600">{errors.items}</p>
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
            shippingZones={SHIPPING_ZONES}
            shippingZoneId={shippingZoneId}
            onShippingChange={(id) => {
              setShippingZoneId(id)
              setErrors((e) => ({ ...e, shippingZoneId: undefined }))
            }}
            advance={advance}
            onAdvanceChange={setAdvance}
            discount={discount}
            onDiscountChange={setDiscount}
            subtotal={subtotal}
          />
          {errors.shippingZoneId && (
            <p className="-mt-2 text-[11px] text-red-600">
              {errors.shippingZoneId}
            </p>
          )}

          <OrderDetailsCard
            teamMembers={TEAM_MEMBERS}
            assignTo={assignTo}
            onAssignToChange={setAssignTo}
            couriers={COURIER_SERVICES}
            courier={courier}
            onCourierChange={setCourier}
            sources={ORDER_SOURCES}
            source={source}
            onSourceChange={setSource}
          />

          <button
            type="button"
            onClick={handleSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-(--primary) px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover)"
          >
            <CheckCircle2 className="size-4" />
            Create Order
          </button>
          <p className="text-center text-[11px] text-(--text-muted)">
            Inventory will be immediately reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
