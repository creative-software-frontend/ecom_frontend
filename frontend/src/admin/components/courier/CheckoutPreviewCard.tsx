import { Eye, Radio, MapPin } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import { COURIER_ZONES } from "../../types/courier"
import type { CourierFormValues } from "../../schemas/courierSchema"

const DEMO_SUBTOTAL = 1450

export function CheckoutPreviewCard({ values }: { values: CourierFormValues }) {
  const fees: Record<string, number> = {
    inside_dhaka: values.inside_dhaka_fee,
    sub_dhaka: values.sub_dhaka_fee,
    outside_dhaka: values.outside_dhaka_fee,
  }
  const shipping = values.inside_dhaka_fee
  const total = DEMO_SUBTOTAL + shipping

  return (
    <section className="space-y-3 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Eye className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-(--text-primary)">
            Checkout preview
          </h3>
        </div>
        <span className="rounded bg-(--status-delivered-bg) px-2 py-0.5 text-xs font-semibold text-(--status-delivered-text) uppercase">
          Storefront Live
        </span>
      </div>
      <p className="text-xs leading-relaxed text-(--text-muted)">
        This is how your 3 predefined delivery options appear to customers
        during storefront checkout:
      </p>

      <div>
        <div className="flex items-center justify-between text-xs text-(--text-muted)">
          <span className="font-semibold text-(--text-primary)">
            Delivery Method
          </span>
          <span>Step 2 of 3</span>
        </div>
        <div className="mt-2 space-y-1.5">
          {COURIER_ZONES.map((zone, idx) => {
            const isSelected = idx === 0
            return (
              <div
                key={zone.id}
                className={`rounded-md border p-2 ${
                  isSelected
                    ? "border-primary bg-(--primary-soft)"
                    : "border-(--border-light) bg-(--bg-surface)"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs font-medium text-(--text-primary)">
                    {isSelected && <Radio className="size-3 text-primary" />}
                    {zone.nameEn} (৳{fees[zone.id]})
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      isSelected ? "text-primary" : "text-(--text-muted)"
                    }`}
                  >
                    ৳{fees[zone.id]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-(--text-muted)">
                  {idx === 0 && "1–2 Days Delivery • Core City"}
                  {idx === 1 && "2–3 Days Delivery"}
                  {idx === 2 && "3–5 Days Delivery • All 61 Districts"}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-(--border-light) pt-2 text-xs">
        <div className="flex justify-between py-0.5">
          <span className="text-(--text-muted)">Cart Subtotal</span>
          <span className="font-semibold text-(--text-primary) tabular-nums">
            {formatTaka(DEMO_SUBTOTAL)}
          </span>
        </div>
        <div className="flex justify-between py-0.5">
          <span className="text-(--text-muted)">Shipping (Inside Dhaka)</span>
          <span className="font-semibold text-(--text-primary) tabular-nums">
            + {formatTaka(shipping)}
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-(--border-light) pt-1.5">
          <span className="font-semibold text-(--text-primary)">
            Total Payable (COD)
          </span>
          <span className="font-bold text-primary tabular-nums">
            {formatTaka(total)}
          </span>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-(--text-muted)">
        <Eye className="mt-0.5 size-3 shrink-0" />
        Estimated delivery updates automatically upon phone lookup.
      </p>

      {values.free_delivery_above > 0 && (
        <div className="flex items-start gap-1.5 rounded-md border border-(--status-delivered-bg) bg-(--primary-soft) p-2 text-xs leading-relaxed text-(--text-primary)">
          <MapPin className="mt-0.5 size-3 shrink-0 text-primary" />
          <span>
            Offer free shipping on orders above{" "}
            {formatTaka(values.free_delivery_above)} to boost checkout
            conversion rates across all Bangladesh divisions.
          </span>
        </div>
      )}
    </section>
  )
}
