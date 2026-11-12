import type { UseFormReturn } from "react-hook-form"
import { MapPin, Lock, Check, AlertTriangle } from "lucide-react"
import { CourierCardHeader } from "./CourierCardHeader"
import { FormToggle } from "../settings/SettingsField"
import { COURIER_ZONES } from "../../types/courier"
import type { CourierFormValues } from "../../schemas/courierSchema"

/* Delivery zones — 3 fixed tiers, fee editable per row. */
export function DeliveryZonesCard({
  form,
}: {
  form: UseFormReturn<CourierFormValues>
}) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form

  const enabled = watch("enabled")
  const flatFeeEnabled = watch("flat_fee_enabled")

  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <CourierCardHeader
        icon={<MapPin className="size-4" />}
        title="Delivery zones"
        subtitle="Preconfigured standard shipping zones across Bangladesh. Rates apply during storefront checkout."
        badge={
          <span className="rounded bg-(--bg-surface-hover) px-2 py-0.5 text-xs font-medium text-(--text-muted)">
            3 Predefined Zones
          </span>
        }
        right={
          <div className="flex items-center gap-2">
            <span className="text-xs text-(--text-muted)">
              Enable courier delivery
            </span>
            <FormToggle
              checked={enabled}
              onChange={(v) => setValue("enabled", v, { shouldDirty: true })}
              aria-label="Enable courier delivery"
            />
          </div>
        }
      />

      <div className="space-y-3 p-4">
        {/* Flat fee sub-card */}
        <div className="rounded-md border border-(--border-light) bg-(--primary-soft) p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded bg-white text-primary">
                <MapPin className="size-3.5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-(--text-primary)">
                    Flat Delivery Fee{" "}
                    <span className="font-normal text-(--text-muted)">
                      (প্রতি অঞ্চলে নির্দিষ্ট ফি)
                    </span>
                  </p>
                  {flatFeeEnabled && (
                    <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-(--text-muted)">
                  Enforces fixed flat rates per zone regardless of weight or
                  parcel dimensions.
                </p>
              </div>
            </div>
            <FormToggle
              checked={flatFeeEnabled}
              onChange={(v) =>
                setValue("flat_fee_enabled", v, { shouldDirty: true })
              }
              aria-label="Enable flat delivery fee"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded bg-(--bg-surface) px-2 py-1.5 text-xs">
            <span className="text-(--text-muted)">
              When ON: Fixed flat rates apply strictly per zone. (Inside ৳60,
              Sub-Dhaka ৳100, Outside ৳130).
            </span>
            <span className="shrink-0 text-(--text-muted)">
              Turn OFF for dynamic courier weight calculation
            </span>
          </div>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-[auto_minmax(0,1.6fr)_auto_minmax(0,2.2fr)_auto] items-center gap-2 px-2 text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
          <div />
          <div>Zone name</div>
          <div>Fee</div>
          <div>Coverage / Districts</div>
          <div />
        </div>

        {/* Zone rows */}
        {COURIER_ZONES.map((zone) => {
          const feeError = errors[zone.feeKey]?.message
          return (
            <div
              key={zone.id}
              className={`grid grid-cols-[auto_minmax(0,1.6fr)_auto_minmax(0,2.2fr)_auto] items-center gap-2 rounded-md border px-2 py-2 ${
                feeError
                  ? "border-red-300 bg-red-50"
                  : "border-(--border-light) bg-(--bg-surface)"
              }`}
            >
              {/* Active checkbox (fixed) */}
              <span
                className="flex size-4 items-center justify-center rounded border border-primary bg-primary text-white"
                title="Zone always active"
              >
                <Check className="size-2.5" />
              </span>

              {/* Zone name */}
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-(--text-primary)">
                  {zone.nameEn}{" "}
                  <span className="font-normal text-(--text-muted)">
                    ({zone.nameBn})
                  </span>
                </p>
                <p className="text-xs text-(--text-muted) tabular-nums">
                  Zone ID: {zone.zoneId}
                </p>
              </div>

              {/* Fee */}
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs text-(--text-muted)">
                  ৳
                </span>
                <input
                  type="number"
                  min={0}
                  className="h-8 w-20 rounded border border-(--border-light) bg-(--bg-surface) pr-2 pl-5 text-right text-xs text-(--text-primary) tabular-nums outline-none focus:border-primary"
                  aria-invalid={Boolean(feeError)}
                  {...register(zone.feeKey, { valueAsNumber: true })}
                />
              </div>

              {/* Coverage chips */}
              <div className="flex min-h-8 flex-wrap items-center gap-1 rounded border border-(--border-light) bg-(--bg-app) px-2 py-1">
                {zone.districts.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center rounded bg-(--bg-surface) px-1.5 py-0.5 text-xs font-medium text-(--text-primary)"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Lock icon */}
              <span
                className="text-(--text-muted)"
                title="Zone districts are locked to standard BD logistics"
              >
                <Lock className="size-3.5" />
              </span>

              {feeError && (
                <div className="col-span-5 flex items-center gap-1 text-xs font-medium text-red-600">
                  <AlertTriangle className="size-3" />
                  {feeError}
                </div>
              )}
            </div>
          )
        })}

        {/* Footer note */}
        <p className="text-xs text-(--text-muted)">
          Zones are fixed and strictly predefined for Bangladesh e-commerce
          standard logistics.
          <span className="ml-2">Auto-matched on checkout.</span>
        </p>

        {/* Free delivery above */}
        <div className="rounded-md border border-(--border-light) bg-(--bg-app) p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-(--text-primary)">
                Free delivery above
              </p>
              <p className="text-xs text-(--text-muted)">
                Orders qualifying above this cart total receive zero delivery
                fee.
              </p>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-xs text-(--text-muted)">
                ৳
              </span>
              <input
                type="number"
                min={0}
                className="h-8 w-32 rounded border border-(--border-light) bg-(--bg-surface) pr-2 pl-6 text-right text-xs text-(--text-primary) tabular-nums outline-none focus:border-primary"
                aria-invalid={Boolean(errors.free_delivery_above)}
                {...register("free_delivery_above", { valueAsNumber: true })}
              />
            </div>
          </div>
          {errors.free_delivery_above && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
              <AlertTriangle className="size-3" />
              {errors.free_delivery_above.message}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
