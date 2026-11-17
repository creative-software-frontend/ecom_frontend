import { Banknote } from "lucide-react"
import { formatTaka } from "../../lib/orderStatus"
import type { ShippingZone } from "../../types/order"

type PricingCardProps = {
  shippingZones: ShippingZone[]
  shippingZoneId: string
  onShippingChange: (id: string) => void
  advance: number
  onAdvanceChange: (v: number) => void
  discount: number
  onDiscountChange: (v: number) => void
  subtotal: number
}

export function PricingCard({
  shippingZones,
  shippingZoneId,
  onShippingChange,
  advance,
  onAdvanceChange,
  discount,
  onDiscountChange,
  subtotal,
}: PricingCardProps) {
  const selectedZone = shippingZones.find((z) => z.id === shippingZoneId)
  const shippingFee = selectedZone?.fee ?? 0
  const total = subtotal + shippingFee - advance - discount

  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-4">
        <Banknote className="size-4 text-(--primary)" />
        <h2 className="text-sm font-semibold text-(--text-primary)">Pricing</h2>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Shipping Charge
          </label>
          <select
            value={shippingZoneId}
            onChange={(e) => onShippingChange(e.target.value)}
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          >
            <option value="">
              Select shipping zone {shippingFee === 0 ? "(৳ 0)" : ""}
            </option>
            {shippingZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} (৳ {z.fee})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Advance (৳)
          </label>
          <input
            type="number"
            min={0}
            value={advance || ""}
            onChange={(e) => onAdvanceChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Discount (৳)
          </label>
          <input
            type="number"
            min={0}
            value={discount || ""}
            onChange={(e) => onDiscountChange(Number(e.target.value) || 0)}
            placeholder="0"
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-(--border-light) pt-4 text-sm">
          <div className="flex justify-between text-(--text-muted)">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatTaka(subtotal)}</span>
          </div>
          <div className="flex justify-between text-(--text-muted)">
            <span>Shipping Fee</span>
            <span className="tabular-nums">{formatTaka(shippingFee)}</span>
          </div>
          {advance > 0 && (
            <div className="flex justify-between text-(--text-muted)">
              <span>Advance Paid</span>
              <span className="tabular-nums">− {formatTaka(advance)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-(--text-muted)">
              <span>Discount</span>
              <span className="tabular-nums">− {formatTaka(discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-(--border-light) pt-3">
            <span className="text-sm font-semibold text-(--text-primary)">
              Total
            </span>
            <span className="text-lg font-bold text-(--primary) tabular-nums">
              {formatTaka(Math.max(0, total))}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
