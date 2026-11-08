import { ShieldCheck, Check } from "lucide-react"

const RULES = [
  "Delivery zones are fixed to 3 standard tiers (Inside, Sub-Dhaka, Outside).",
  "Flat Delivery Fee applies strictly per zone regardless of weight when enabled.",
  "Active couriers (Steadfast, Pathao) receive these flat fees automatically.",
]

export function LogisticsRulesCard() {
  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-(--text-primary)">
        <ShieldCheck className="size-4 text-primary" />
        Logistics Rules
      </h3>
      <ul className="space-y-1.5">
        {RULES.map((rule) => (
          <li
            key={rule}
            className="flex items-start gap-1.5 text-[11px] leading-relaxed text-(--text-muted)"
          >
            <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
            {rule}
          </li>
        ))}
      </ul>
    </section>
  )
}
