import { Search, Plus } from "lucide-react"

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
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
        <input
          type="search"
          placeholder="Search roles..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
        />
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
      >
        <Plus className="size-3.5" />
        Create role
      </button>
    </div>
  )
}
