import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Truck } from "lucide-react"
import { courierApi } from "../../api/courierApi"
import { ordersApi } from "../../api/ordersApi"
import { useCourierAccountsQuery } from "../../hooks/useCourierQuery"
import { useEscapeKey } from "../../hooks/useEscapeKey"
import { getErrorMessage } from "../../lib/errors"
import type {
  PaymentStatus,
  OrderStatus,
  DispatchOrderPayload,
} from "../../types/order"
import type { CourierAccount, CourierSlug } from "../../types/courier"
import { ConfirmationDialog } from "../common/ConfirmationDialog"
import { DialogShell } from "../common/DialogShell"
import { InlineNotice } from "../common/InlineNotice"
import { LoadingState } from "../common/LoadingState"
import { AdminSearchSelect } from "../common/AdminSearchSelect"

const PENDING_CONFIRM_PROMPT =
  "অর্ডারটি এখনো Pending আছে। আপনি কি এটি Confirm করে কুরিয়ারে পাঠাতে চান?"

export const COURIER_LABELS: Record<CourierSlug, string> = {
  steadfast: "Steadfast",
  pathao: "Pathao",
  redx: "RedX",
  carrybee: "Carrybee",
}

export type DispatchTarget = {
  id: number
  orderNumber: string
  total: number
  advance?: number
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
}

export type DispatchCourierModalProps = {
  open: boolean
  targets: DispatchTarget[]
  initialSlug?: CourierSlug | null
  onClose: () => void
  onDispatched?: () => void | Promise<void>
}

/** True only for enabled accounts whose required credentials are saved. */
export function isDispatchableAccount(account: CourierAccount): boolean {
  if (!account.enabled) return false
  const has = (value: string | null) => typeof value === "string" && value.trim().length > 0
  switch (account.slug) {
    case "steadfast":
      return account.hasApiKey && account.hasSecretKey
    case "pathao":
      return (
        has(account.clientId) &&
        account.hasClientSecret &&
        has(account.username) &&
        account.hasPassword &&
        has(account.storeId)
      )
    case "redx":
      return has(account.storeId) && account.hasAccessToken
    case "carrybee":
      return (
        has(account.clientId) &&
        account.hasClientSecret &&
        has(account.storeId) &&
        has(account.clientContext)
      )
    default:
      return false
  }
}

const inputClass =
  "h-9 w-full rounded-md border border-(--border-light) bg-white px-2.5 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
const labelClass =
  "mb-1 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase"

function codFor(target: DispatchTarget): number {
  return target.paymentStatus === "paid"
    ? 0
    : Math.max(0, target.total - (target.advance ?? 0))
}

export function DispatchCourierModal({
  open,
  targets,
  initialSlug = null,
  onClose,
  onDispatched,
}: DispatchCourierModalProps) {
  const accountsQuery = useCourierAccountsQuery()
  const [slug, setSlug] = useState<CourierSlug | null>(initialSlug)
  const [cityId, setCityId] = useState<number | undefined>()
  const [zoneId, setZoneId] = useState<number | undefined>()
  const [areaId, setAreaId] = useState<number | undefined>()
  const [areaName, setAreaName] = useState("")
  const [areaSearch, setAreaSearch] = useState("")
  const [itemWeight, setItemWeight] = useState("0.5")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEscapeKey(onClose, open && !busy && !confirmOpen)

  useEffect(() => {
    if (!open) return
    setSlug(initialSlug)
    setCityId(undefined)
    setZoneId(undefined)
    setAreaId(undefined)
    setAreaName("")
    setAreaSearch("")
    setItemWeight("0.5")
    setNote("")
    setBusy(false)
    setError(null)
    setConfirmOpen(false)
  }, [open, initialSlug])

  const isBulk = targets.length > 1
  const primaryTarget = targets[0]
  const dispatchable = useMemo(
    () => (accountsQuery.data ?? []).filter(isDispatchableAccount),
    [accountsQuery.data]
  )
  const selectedAccount = dispatchable.find((account) => account.slug === slug)
  const needsLocation = slug === "pathao" || slug === "carrybee"
  const bulkUnsupported = isBulk && slug !== null && slug !== "steadfast"
  const hasPending = targets.some((target) => target.orderStatus === "pending")
  const totalCod = targets.reduce((sum, target) => sum + codFor(target), 0)

  const citiesQuery = useQuery({
    queryKey: ["admin", "courier", "locations", slug ?? "", "cities"],
    queryFn: ({ signal }) => {
      if (!slug) throw new Error("Select a courier first.")
      return courierApi.getCities(slug, signal)
    },
    enabled: open && (slug === "pathao" || slug === "carrybee"),
    staleTime: 60 * 1000,
  })

  const zonesQuery = useQuery({
    queryKey: [
      "admin",
      "courier",
      "locations",
      slug ?? "",
      "zones",
      cityId ?? 0,
    ],
    queryFn: ({ signal }) => {
      if (!slug || !cityId) throw new Error("Select a city first.")
      return courierApi.getZones(slug, cityId, signal)
    },
    enabled: open && needsLocation && Boolean(cityId),
    staleTime: 60 * 1000,
  })

  const areasQuery = useQuery({
    queryKey: [
      "admin",
      "courier",
      "locations",
      slug ?? "",
      "areas",
      cityId ?? 0,
      zoneId ?? 0,
    ],
    queryFn: ({ signal }) => {
      if (!slug) throw new Error("Select a courier first.")
      return courierApi.getAreas(
        slug,
        { cityId, zoneId },
        signal
      )
    },
    enabled:
      open &&
      (slug === "redx" ||
        (needsLocation && Boolean(zoneId))),
    staleTime: 60 * 1000,
  })

  const filteredAreas = useMemo(() => {
    const term = areaSearch.trim().toLowerCase()
    if (!term) return areasQuery.data ?? []
    return (areasQuery.data ?? []).filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        (option.districtName ?? "").toLowerCase().includes(term)
    )
  }, [areasQuery.data, areaSearch])

  function handleSlugChange(next: string) {
    setSlug(next ? (next as CourierSlug) : null)
    setCityId(undefined)
    setZoneId(undefined)
    setAreaId(undefined)
    setAreaName("")
    setAreaSearch("")
    setError(null)
  }

  async function runDispatch(confirmFirst: boolean) {
    if (!slug || bulkUnsupported || targets.length === 0 || busy) return
    setBusy(true)
    setError(null)
    const payload: DispatchOrderPayload = {
      courierSlug: slug,
      ...(cityId ? { cityId } : {}),
      ...(zoneId ? { zoneId } : {}),
      ...(areaId ? { areaId } : {}),
      ...(areaName ? { areaName } : {}),
      ...(itemWeight.trim() ? { itemWeight: Number(itemWeight) } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      confirmFirst,
    }
    try {
      if (isBulk) {
        const result = await ordersApi.bulkDispatch({
          orderIds: targets.map((target) => target.id),
          courierSlug: "steadfast",
          confirmFirst,
        })
        await onDispatched?.()
        if (result.failedCount > 0) {
          const firstError = result.results.find((item) => !item.ok)?.error
          setError(
            `${result.succeededCount} order(s) dispatched; ${result.failedCount} failed. ${firstError ?? ""}`.trim()
          )
          return
        }
      } else if (primaryTarget) {
        await ordersApi.dispatch(primaryTarget.id, payload)
        await onDispatched?.()
      }
      onClose()
    } catch (cause: unknown) {
      setError(getErrorMessage(cause, "Could not dispatch the order."))
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  function handleSendClick() {
    if (!slug || bulkUnsupported || targets.length === 0 || busy) return
    if (hasPending) {
      setConfirmOpen(true)
      return
    }
    void runDispatch(false)
  }

  if (!open) return null

  return (
    <>
      <DialogShell
        title="Send to courier"
        subtitle={
          <p className="text-xs text-(--text-muted)">
            {isBulk
              ? `${targets.length} orders selected`
              : (primaryTarget?.orderNumber ?? "Order")}
          </p>
        }
        icon={<Truck className="size-4" aria-hidden="true" />}
        titleId="dispatch-courier-title"
        panelClassName="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl"
        closeDisabled={busy}
        onClose={onClose}
      >
        <form
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault()
            handleSendClick()
          }}
        >
          {accountsQuery.isPending ? (
            <LoadingState className="py-6 text-center text-xs text-(--text-muted)">
              Loading courier accounts…
            </LoadingState>
          ) : dispatchable.length === 0 ? (
            <InlineNotice
              variant="error"
              message="No courier is enabled and configured. Add credentials in courier settings before dispatching."
              ariaLive="polite"
              dismissLabel="Dismiss"
              onDismiss={() => setError(null)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary)"
              dismissClassName="rounded px-1.5 py-0.5 text-(--text-muted)"
            />
          ) : null}

          {dispatchable.length > 0 ? (
            <Link
              to="/shop/settings/courier"
              className="text-xs font-medium text-primary hover:underline"
            >
              Manage courier settings
            </Link>
          ) : null}

          <div>
            <label htmlFor="dispatch-courier" className={labelClass}>
              Courier
            </label>
            <select
              id="dispatch-courier"
              value={slug ?? ""}
              onChange={(event) => handleSlugChange(event.target.value)}
              disabled={busy || dispatchable.length === 0}
              className={inputClass}
            >
              <option value="">Select courier</option>
              {dispatchable.map((account) => (
                <option key={account.slug} value={account.slug}>
                  {COURIER_LABELS[account.slug]}
                  {account.isSandbox ? " (Sandbox)" : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount?.isSandbox ? (
            <span className="inline-flex rounded bg-(--status-pending-bg) px-2 py-0.5 text-[11px] font-semibold text-(--status-pending-text)">
              Sandbox mode — parcels go to the test endpoint
            </span>
          ) : null}

          {bulkUnsupported ? (
            <InlineNotice
              variant="error"
              message="Bulk dispatch supports Steadfast only. Select one order at a time for Pathao, RedX or Carrybee."
              ariaLive="polite"
              dismissLabel="Dismiss"
              onDismiss={() => setError(null)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary)"
              dismissClassName="rounded px-1.5 py-0.5 text-(--text-muted)"
            />
          ) : null}

          {needsLocation && !isBulk ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="dispatch-city" className={labelClass}>
                  City
                </label>
                <AdminSearchSelect
                  id="dispatch-city"
                  value={cityId ? String(cityId) : ""}
                  options={(citiesQuery.data ?? []).map((option) => ({
                    value: String(option.id),
                    label: option.name,
                  }))}
                  onValueChange={(value) => {
                    setCityId(value ? Number(value) : undefined)
                    setZoneId(undefined)
                    setAreaId(undefined)
                    setAreaName("")
                  }}
                  placeholder="Select city"
                  searchPlaceholder="Search city"
                  disabled={
                    busy ||
                    citiesQuery.isPending ||
                    (citiesQuery.data ?? []).length === 0
                  }
                />
              </div>
              <div>
                <label htmlFor="dispatch-zone" className={labelClass}>
                  Zone
                </label>
                <select
                  id="dispatch-zone"
                  value={zoneId ?? ""}
                  onChange={(event) => {
                    setZoneId(event.target.value ? Number(event.target.value) : undefined)
                    setAreaId(undefined)
                    setAreaName("")
                  }}
                  disabled={busy || !cityId || zonesQuery.isPending}
                  className={inputClass}
                >
                  <option value="">Select zone</option>
                  {(zonesQuery.data ?? []).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="dispatch-area" className={labelClass}>
                  Area {slug === "pathao" ? "(optional)" : ""}
                </label>
                <select
                  id="dispatch-area"
                  value={areaId ?? ""}
                  onChange={(event) => {
                    const selected = (areasQuery.data ?? []).find(
                      (option) => option.id === Number(event.target.value)
                    )
                    setAreaId(selected?.id)
                    setAreaName(selected?.name ?? "")
                  }}
                  disabled={busy || !zoneId || areasQuery.isPending}
                  className={inputClass}
                >
                  <option value="">{slug === "pathao" ? "No area" : "Select area"}</option>
                  {(areasQuery.data ?? []).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}

          {slug === "redx" && !isBulk ? (
            <div>
              <label htmlFor="dispatch-redx-area" className={labelClass}>
                Delivery area
              </label>
              <input
                id="dispatch-redx-area"
                type="search"
                value={areaSearch}
                onChange={(event) => setAreaSearch(event.target.value)}
                placeholder="Search area by name or district"
                disabled={busy || areasQuery.isPending}
                className={inputClass}
              />
              <select
                aria-label="Delivery area"
                value={areaId ?? ""}
                onChange={(event) => {
                  const selected = (areasQuery.data ?? []).find(
                    (option) => option.id === Number(event.target.value)
                  )
                  setAreaId(selected?.id)
                  setAreaName(selected?.name ?? "")
                }}
                disabled={busy || areasQuery.isPending}
                className={`${inputClass} mt-2`}
              >
                <option value="">Select delivery area</option>
                {filteredAreas.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.districtName ? `${option.districtName} — ` : ""}
                    {option.name}
                  </option>
                ))}
              </select>
              {areasQuery.isPending ? (
                <LoadingState className="pt-2 text-xs text-(--text-muted)">
                  Loading areas…
                </LoadingState>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="dispatch-weight" className={labelClass}>
                Weight (kg)
              </label>
              <input
                id="dispatch-weight"
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={itemWeight}
                onChange={(event) => setItemWeight(event.target.value)}
                disabled={busy}
                className={inputClass}
              />
            </div>
            <div>
              <p className={labelClass}>COD amount to collect</p>
              <p className="rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-sm font-semibold text-(--text-primary) tabular-nums">
                ৳{totalCod}
              </p>
              <p className="mt-1 text-[11px] text-(--text-muted)">
                {isBulk
                  ? "Calculated per order. Paid orders send 0."
                  : "Paid orders send 0; advances are deducted."}
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="dispatch-note" className={labelClass}>
              Note to courier
            </label>
            <textarea
              id="dispatch-note"
              rows={2}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              className="w-full rounded-md border border-(--border-light) bg-white px-2.5 py-2 text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {error ? (
            <InlineNotice
              variant="error"
              message={error}
              ariaLive="assertive"
              dismissLabel="Dismiss"
              onDismiss={() => setError(null)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary)"
              dismissClassName="rounded px-1.5 py-0.5 text-(--text-muted)"
            />
          ) : null}
        </form>

        <div className="flex justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="admin-template-button admin-template-button--secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSendClick}
            disabled={busy || !slug || bulkUnsupported || dispatchable.length === 0}
            className="admin-template-button admin-template-button--primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send to Courier"}
          </button>
        </div>
      </DialogShell>

      <ConfirmationDialog
        open={confirmOpen}
        title="Confirm pending order"
        description={PENDING_CONFIRM_PROMPT}
        variant="warning"
        confirmLabel="Confirm & send"
        cancelLabel="Go back"
        isPending={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void runDispatch(true)}
      />
    </>
  )
}
