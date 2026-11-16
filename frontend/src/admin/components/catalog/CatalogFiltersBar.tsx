import { Search } from "lucide-react"

type FilterSelect = {
  value: string
  onChange: (value: string) => void
  options: { label: string; value: string }[]
  placeholder: string
}

type CatalogFiltersBarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  selects: FilterSelect[]
}

export function CatalogFiltersBar({
  searchValue,
  onSearchChange,
  selects,
}: CatalogFiltersBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-(--border-light) p-4">
      <div className="relative max-w-sm min-w-50 flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--text-muted)" />
        <input
          type="search"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs outline-none focus:border-(--primary)"
        />
      </div>
      {selects.map((select, i) => (
        <select
          key={i}
          value={select.value}
          onChange={(e) => select.onChange(e.target.value)}
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
        >
          <option value="all">{select.placeholder}</option>
          {select.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  )
}
