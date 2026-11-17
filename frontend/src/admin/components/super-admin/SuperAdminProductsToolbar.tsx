import { Search } from "lucide-react"
import type { ShopOption } from "../../types/superAdminProduct"

type SuperAdminProductsToolbarProps = {
  search: string
  onSearchChange: (value: string) => void

  shopId: number | "all"
  onShopChange: (value: number | "all") => void
  shops: ShopOption[]

  status: "all" | "active" | "inactive" | "blocked"
  onStatusChange: (value: "all" | "active" | "inactive" | "blocked") => void

  category: string
  onCategoryChange: (value: string) => void
  categories: string[]

  visibleCount: number
  totalCount: number
}

export function SuperAdminProductsToolbar({
  search,
  onSearchChange,
  shopId,
  onShopChange,
  shops,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  categories,
  visibleCount,
  totalCount,
}: SuperAdminProductsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search by name, brand or SKU..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>

        <select
          value={shopId}
          onChange={(e) =>
            onShopChange(
              e.target.value === "all" ? "all" : Number(e.target.value)
            )
          }
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
        >
          <option value="all">All Shops</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(
              e.target.value as "all" | "active" | "inactive" | "blocked"
            )
          }
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[11px] text-(--text-muted) tabular-nums">
        Showing {visibleCount} of {totalCount}
      </span>
    </div>
  )
}
