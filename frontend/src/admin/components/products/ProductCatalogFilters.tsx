import { Search } from "lucide-react"
import type {
  ProductStatusFilter,
  ProductStockFilter,
} from "./productCatalog"

type ProductCatalogFiltersProps = {
  query: string
  category: string
  stock: ProductStockFilter
  status: ProductStatusFilter
  categories: string[]
  onQueryChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStockChange: (value: ProductStockFilter) => void
  onStatusChange: (value: ProductStatusFilter) => void
}

const selectClassName =
  "h-9 min-w-32 rounded-md border border-(--border-light) bg-white px-3 text-xs text-(--text-primary) outline-none focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"

export function ProductCatalogFilters({
  query,
  category,
  stock,
  status,
  categories,
  onQueryChange,
  onCategoryChange,
  onStockChange,
  onStatusChange,
}: ProductCatalogFiltersProps) {
  return (
    <div className="flex flex-col gap-2.5 border-b border-(--border-light) bg-white px-3 py-2.5 lg:flex-row lg:items-center">
      <label className="relative block min-w-0 flex-1 lg:max-w-md">
        <span className="sr-only">Search products</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-(--text-muted)"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search by product name, slug, or category..."
          className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-3 pl-9 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
        />
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex">
        <label>
          <span className="sr-only">Filter by category</span>
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value)}
            className={selectClassName}
          >
            <option value="all">All Categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by stock</span>
          <select
            value={stock}
            onChange={(event) =>
              onStockChange(event.target.value as ProductStockFilter)
            }
            className={selectClassName}
          >
            <option value="all">All Stock</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select
            value={status}
            onChange={(event) =>
              onStatusChange(event.target.value as ProductStatusFilter)
            }
            className={selectClassName}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
    </div>
  )
}
