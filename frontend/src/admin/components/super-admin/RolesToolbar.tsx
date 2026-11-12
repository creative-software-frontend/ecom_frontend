import { Search, Plus, X } from "lucide-react"

type RolesToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  onAdd: () => void
}

export function RolesToolbar({
  search,
  onSearchChange,
  onAdd,
}: RolesToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search role name, slug, permission..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-72 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>
        <select className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary">
          <option>All Scopes</option>
          <option>Platform</option>
          <option>Shop</option>
        </select>
        <select className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary">
          <option>All Types</option>
          <option>System</option>
          <option>Custom</option>
        </select>
        {search !== "" && (
          <button
            onClick={() => onSearchChange("")}
            className="flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--text-primary)"
          >
            <X className="size-3" /> Clear Filters
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
      >
        <Plus className="size-3.5" /> Create Role
      </button>
    </div>
  )
}
