import { useSearchParams, useNavigate } from "react-router"
import { useQueries } from "@tanstack/react-query"
import { ordersApi, orderQueryKeys } from "../api/ordersApi"
import type { OrderDetail } from "../types/order"
import { formatOrderDate, formatTaka } from "../lib/orderStatus"
import { useAuth } from "../auth/AuthProvider"
import { ArrowLeft, Printer, Tag } from "lucide-react"
import { useState } from "react"

type ApiLike = {
  get(id: number | string, signal?: AbortSignal): Promise<OrderDetail>
}
type QueryKeysLike = {
  detail(id: number | string): readonly unknown[]
}

export type InvoicePrintPageProps = {
  api?: ApiLike
  queryKeys?: QueryKeysLike
}

type InvoiceSize = "A4" | "A5" | "3in"
type InvoiceMode = "invoice" | "label"

const SIZE_CONFIG: Record<
  InvoiceSize,
  { width: string; fontSize: string; label: string }
> = {
  A4: { width: "595px", fontSize: "text-sm", label: "A4" },
  A5: { width: "420px", fontSize: "text-xs", label: "A5" },
  "3in": { width: "216px", fontSize: "text-[10px]", label: "3in" },
}

export default function InvoicePrintPage({
  api = ordersApi,
  queryKeys = orderQueryKeys,
}: InvoicePrintPageProps = {}) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { state } = useAuth()
  const shop = state.status === "authenticated" ? state.user.shop : null

  const [size, setSize] = useState<InvoiceSize>("A4")
  const [mode, setMode] = useState<InvoiceMode>("invoice")

  // Parse comma-separated order IDs from URL ?ids=1,2,3
  const rawIds = searchParams.get("ids") ?? ""
  const orderIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  const results = useQueries({
    queries: orderIds.map((id) => ({
      queryKey: queryKeys.detail(id),
      queryFn: ({ signal }: { signal: AbortSignal }) => api.get(id, signal),
      staleTime: 60 * 1000,
    })),
  })

  const loading = results.some((r) => r.isPending)
  const orders = results
    .filter((r) => r.status === "success")
    .map((r) => r.data!)

  const { width, fontSize, label: sizeLabel } = SIZE_CONFIG[size]

  function handlePrint() {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ── Top Control Bar (hidden on print) ── */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 shadow-sm print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="mb-1 flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--primary)"
        >
          <ArrowLeft className="size-3" /> Back to Order
        </button>

        {/* Mode toggle */}
        <button
          type="button"
          onClick={() => setMode(mode === "invoice" ? "label" : "invoice")}
          className="admin-template-button admin-template-button--secondary flex h-8 items-center gap-1.5 px-3 text-xs"
        >
          <Tag className="size-3.5" />
          {mode === "invoice" ? "Label" : "Invoice"}
        </button>

        {/* Size selector */}
        <div className="flex items-center overflow-hidden rounded-md border border-gray-200">
          {(["A4", "A5", "3in"] as InvoiceSize[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`h-8 px-3 text-xs font-medium transition-colors ${
                size === s
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={handlePrint}
          className="admin-template-button admin-template-button--primary flex h-8 items-center gap-1.5 px-4 text-xs"
        >
          <Printer className="size-3.5" />
          Print invoice
        </button>
      </div>

      {/* ── Invoice Sheets ── */}
      <div className="flex flex-col items-center gap-6 py-8 print:gap-0 print:py-0">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-500">
            Loading invoices…
          </div>
        ) : orders.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-sm text-gray-500">
            No orders found.
          </div>
        ) : (
          orders.map((order, idx) =>
            mode === "invoice" ? (
              <InvoiceSheet
                key={order.id}
                order={order}
                shop={shop}
                width={width}
                fontSize={fontSize}
                sizeLabel={sizeLabel}
                pageBreak={idx < orders.length - 1}
              />
            ) : (
              <LabelSheet
                key={order.id}
                order={order}
                shop={shop}
                width={width}
                fontSize={fontSize}
                pageBreak={idx < orders.length - 1}
              />
            )
          )
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Invoice Sheet
   ============================================================ */
function InvoiceSheet({
  order,
  shop,
  width,
  fontSize,
  sizeLabel,
  pageBreak,
}: {
  order: OrderDetail
  shop: { id: number; name: string; slug: string; status: string } | null
  width: string
  fontSize: string
  sizeLabel: string
  pageBreak: boolean
}) {
  const isSmall = sizeLabel === "3in"

  return (
    <div
      style={{ width }}
      className={`bg-white shadow-md print:w-full print:shadow-none ${
        pageBreak ? "print:break-after-page" : ""
      }`}
    >
      <div className={`p-6 ${fontSize} ${isSmall ? "p-3" : ""}`}>
        {/* ── Header ── */}
        <div
          className={`flex ${isSmall ? "flex-col gap-2" : "items-start justify-between"} mb-5`}
        >
          {/* Merchant info */}
          <div>
            <p className="text-lg leading-tight font-bold text-gray-900">
              {shop?.name ?? "Your Shop"}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Merchant ID: {order.shopId}
            </p>
            <p className="text-xs text-gray-500">
              {/* phone from settings if available */}
            </p>
          </div>

          {/* INVOICE title + meta */}
          <div className={`${isSmall ? "" : "text-right"}`}>
            <p className="text-2xl font-black tracking-wide text-gray-800">
              INVOICE
            </p>
            <table className="mt-1 ml-auto text-xs text-gray-600">
              <tbody>
                <tr>
                  <td className="pr-3 text-gray-400">Invoice no</td>
                  <td className="text-right font-semibold">#{order.id}</td>
                </tr>
                <tr>
                  <td className="pr-3 text-gray-400">Parcel ID</td>
                  <td className="text-right font-semibold">{order.id}</td>
                </tr>
                <tr>
                  <td className="pr-3 text-gray-400">Date</td>
                  <td className="text-right font-semibold">
                    {formatOrderDate(order.createdAt)}
                  </td>
                </tr>
                <tr>
                  <td className="pr-3 text-gray-400">Tracking</td>
                  <td className="text-right font-mono font-semibold">
                    {order.orderNumber}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr className="mb-4 border-gray-200" />

        {/* ── Deliver To + Barcode area ── */}
        <div
          className={`flex ${isSmall ? "flex-col gap-3" : "items-start justify-between"} mb-4`}
        >
          <div>
            <p className="mb-1 text-[10px] tracking-widest text-gray-400 uppercase">
              Deliver To
            </p>
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
            <p className="text-gray-600">{order.customerAddress}</p>
            <p className="text-gray-600">{order.deliveryArea}</p>
          </div>

          {/* Barcode placeholder */}
          {!isSmall && (
            <div className="flex flex-col items-center">
              <BarcodeBar value={order.orderNumber} />
              <p className="mt-1 font-mono text-[10px] text-gray-500">
                {order.orderNumber}
              </p>
            </div>
          )}
        </div>

        <hr className="mb-4 border-gray-200" />

        {/* ── Items table ── */}
        <table className="mb-4 w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="pb-1.5 text-left text-[10px] tracking-widest text-gray-400 uppercase">
                Description
              </th>
              <th className="pb-1.5 text-right text-[10px] tracking-widest text-gray-400 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-2 text-gray-800">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-[10px] text-gray-400">
                    Parcel #{order.id} · {item.quantity} pcs
                  </p>
                </td>
                <td className="py-2 text-right font-medium text-gray-800">
                  {formatTaka(item.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Amount to Collect ── */}
        <div className="mb-4 flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
            Amount to Collect
          </span>
          <span className="text-lg font-bold text-emerald-900">
            {formatTaka(order.total)}
          </span>
        </div>

        {/* ── Note ── */}
        {order.notes && (
          <div className="mb-4 rounded-md border border-gray-200 px-3 py-2">
            <p className="mb-0.5 text-[10px] tracking-widest text-gray-400 uppercase">
              Note
            </p>
            <p className="text-gray-700">{order.notes}</p>
          </div>
        )}

        {/* ── Footer ── */}
        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-[10px] text-gray-400">Thank you for your order.</p>
          <p className="text-[10px] text-gray-400">
            Powered by{" "}
            <span className="font-semibold text-gray-600">
              power zenox
            </span>{" "}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Label / Sticker Sheet
   ============================================================ */
function LabelSheet({
  order,
  shop,
  width,
  fontSize,
  pageBreak,
}: {
  order: OrderDetail
  shop: { id: number; name: string; slug: string; status: string } | null
  width: string
  fontSize: string
  pageBreak: boolean
}) {
  return (
    <div
      style={{ width }}
      className={`bg-white shadow-md print:w-full print:shadow-none ${
        pageBreak ? "print:break-after-page" : ""
      }`}
    >
      <div className={`p-4 ${fontSize} border-2 border-dashed border-gray-300`}>
        {/* Shop name header */}
        <div className="mb-3 border-b-2 border-gray-900 pb-2">
          <p className="text-center text-base font-black">
            {shop?.name ?? "Shop"}
          </p>
        </div>

        {/* From / To */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
              From
            </p>
            <p className="font-semibold text-gray-900">
              {shop?.name ?? "Shop"}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase">
              To
            </p>
            <p className="font-bold text-gray-900">{order.customerName}</p>
            <p className="text-gray-700">{order.customerPhone}</p>
            <p className="text-[10px] text-gray-700">{order.customerAddress}</p>
            <p className="text-[10px] text-gray-700">{order.deliveryArea}</p>
          </div>
        </div>

        {/* Barcode + order number */}
        <div className="flex flex-col items-center border-t border-gray-200 pt-2">
          <BarcodeBar value={order.orderNumber} />
          <p className="mt-1 font-mono text-xs tracking-widest text-gray-700">
            {order.orderNumber}
          </p>
        </div>

        {/* COD amount */}
        <div className="mt-2 flex justify-between rounded border border-gray-900 px-3 py-1">
          <span className="text-[10px] font-bold uppercase">COD</span>
          <span className="font-bold">{formatTaka(order.total)}</span>
        </div>
      </div>
    </div>
  )
}

/* ============================================================
   Simple CSS barcode bars (visual representation)
   ============================================================ */
function BarcodeBar({ value }: { value: string }) {
  // Generate deterministic bar widths from string chars
  const bars = Array.from(value).flatMap((ch) => {
    const n = ch.charCodeAt(0) % 16
    return [
      { w: 1 + (n & 1), gap: 1 + ((n >> 1) & 1) },
      { w: 1 + ((n >> 2) & 1), gap: 1 + ((n >> 3) & 1) },
    ]
  })

  return (
    <div
      className="flex items-stretch"
      style={{ height: "48px", gap: "0px" }}
      aria-hidden="true"
    >
      {bars.map((bar, i) => (
        <div key={i} className="flex" style={{ gap: `${bar.gap}px` }}>
          <div
            className="bg-gray-900"
            style={{ width: `${bar.w}px`, height: "100%" }}
          />
        </div>
      ))}
    </div>
  )
}
