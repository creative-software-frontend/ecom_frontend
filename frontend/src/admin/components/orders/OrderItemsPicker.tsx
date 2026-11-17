import { useMemo, useRef, useState } from "react"
import { Package, Plus, Search, Minus, Trash2 } from "lucide-react"
import type { CreateOrderItem, PickerProduct } from "../../types/order"
import { formatTaka } from "../../lib/orderStatus"

type OrderItemsPickerProps = {
  products: PickerProduct[]
  items: CreateOrderItem[]
  onChange: (items: CreateOrderItem[]) => void
}

export function OrderItemsPicker({
  products,
  items,
  onChange,
}: OrderItemsPickerProps) {
  const [query, setQuery] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    )
  }, [products, query])

  function addProduct(product: PickerProduct) {
    const existing = items.find((i) => i.productId === product.id)
    if (existing) {
      onChange(
        items.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      )
    } else {
      onChange([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.price,
          image: product.image,
        },
      ])
    }
    setQuery("")
    setShowDropdown(false)
    inputRef.current?.blur()
  }

  function updateQty(productId: number, delta: number) {
    onChange(
      items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i
      )
    )
  }

  function removeItem(productId: number) {
    onChange(items.filter((i) => i.productId !== productId))
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)

  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <div className="flex items-center justify-between border-b border-(--border-light) px-5 py-4">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-(--primary)" />
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Order Items
          </h2>
        </div>
        <span className="text-[11px] text-(--text-muted)">SKU Live Sync</span>
      </div>

      <div className="space-y-3 px-5 py-4">
        {/* Search with inline dropdown */}
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-(--text-muted)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search products to add..."
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-10 text-sm text-(--text-primary) transition-all outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          />
          {showDropdown && filtered.length > 0 && (
            <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-md border border-(--border-light) bg-(--bg-surface) shadow-lg">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center justify-between gap-2 border-b border-(--border-light) px-3 py-2 text-left text-sm transition-colors last:border-0 hover:bg-(--bg-surface-hover)"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-(--text-primary)">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-(--text-muted)">{p.sku}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-(--text-primary) tabular-nums">
                    {formatTaka(p.price)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart or empty state */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-(--border-light) py-12 text-center">
            <Package className="size-8 text-(--text-muted)" />
            <p className="text-sm text-(--text-muted)">
              Search and add products to the order
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => addProduct(products[3])}
                className="rounded border border-(--border-light) bg-(--bg-surface) px-2.5 py-1 text-[11px] font-medium text-(--text-muted) hover:bg-(--bg-surface-hover)"
              >
                + Add Sample: Zenox Tonic
              </button>
              <button
                type="button"
                onClick={() => addProduct(products[0])}
                className="rounded border border-(--border-light) bg-(--bg-surface) px-2.5 py-1 text-[11px] font-medium text-(--text-muted) hover:bg-(--bg-surface-hover)"
              >
                + Add Sample: Capsules
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-(--border-light)">
            <table className="w-full text-sm">
              <thead className="bg-(--bg-table-header) text-[11px] tracking-wider text-(--text-muted) uppercase">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Product</th>
                  <th className="px-3 py-2 text-center font-medium">Qty</th>
                  <th className="px-3 py-2 text-right font-medium">Price</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="w-10 px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--border-light)">
                {items.map((item) => (
                  <tr key={item.productId} className="bg-(--bg-surface)">
                    <td className="px-3 py-2 font-medium text-(--text-primary)">
                      {item.productName}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, -1)}
                          className="flex size-6 items-center justify-center rounded border border-(--border-light) text-(--text-muted) hover:bg-(--bg-surface-hover)"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-(--text-primary) tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.productId, 1)}
                          className="flex size-6 items-center justify-center rounded border border-(--border-light) text-(--text-muted) hover:bg-(--bg-surface-hover)"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs text-(--text-muted) tabular-nums">
                      {formatTaka(item.unitPrice)}
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-semibold text-(--text-primary) tabular-nums">
                      {formatTaka(item.unitPrice * item.quantity)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="rounded p-1 text-red-500 hover:bg-red-50"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between border-t border-(--border-light) bg-(--bg-table-header) px-3 py-2 text-xs">
              <span className="text-(--text-muted)">
                {items.reduce((s, i) => s + i.quantity, 0)} items total
              </span>
              <span className="font-semibold text-(--text-primary) tabular-nums">
                {formatTaka(subtotal)}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
