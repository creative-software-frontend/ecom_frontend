import { Store, AlertCircle, CheckCircle2, Lock } from "lucide-react"
import type { ShopOption } from "../../types/superAdminProduct"

type ShopSelectorCardProps = {
  shops: ShopOption[]
  value: number | null
  onChange: (shopId: number | null) => void
  /** When true, dropdown is read-only — shop cannot be changed after creation. */
  locked?: boolean
}

export function ShopSelectorCard({
  shops,
  value,
  onChange,
  locked = false,
}: ShopSelectorCardProps) {
  const selected = shops.find((s) => s.id === value)

  return (
    <section
      className={`rounded-lg border-2 p-4 transition-colors ${
        selected
          ? "border-(--primary)/40 bg-(--primary-soft)/30"
          : "border-amber-300 bg-amber-50/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white ${
            selected ? "bg-(--primary)" : "bg-amber-500"
          }`}
        >
          <Store className="size-5" />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-(--text-primary)">
              {locked ? "Shop (locked)" : "Create product for which shop?"}
            </h2>
            {locked ? (
              <span className="inline-flex items-center gap-1 rounded bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-(--text-muted) uppercase">
                <Lock className="size-2.5" /> Locked
              </span>
            ) : (
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                  selected
                    ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {selected ? "Selected" : "Required"}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            {locked
              ? "This product belongs to this shop. The shop cannot be changed after creation."
              : "This product will appear in the selected shop's storefront and catalog. Only this shop's admin will be able to see it."}
          </p>

          <div className="mt-3">
            <select
              value={value ?? ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              disabled={locked}
              className="h-10 w-full max-w-md rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">Select a shop...</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.slug}
                </option>
              ))}
            </select>
          </div>

          {!locked && !selected ? (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700">
              <AlertCircle className="size-3.5 shrink-0" />
              Please select a shop before filling out the form below.
            </div>
          ) : selected ? (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-(--status-delivered-text)">
              <CheckCircle2 className="size-3.5 shrink-0" />
              {locked ? (
                <>
                  Owned by <strong>{selected.name}</strong>
                </>
              ) : (
                <>
                  Creating for <strong>{selected.name}</strong> — you can change
                  this before saving.
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
