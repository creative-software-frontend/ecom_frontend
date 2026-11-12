import { Search, X } from "lucide-react"

type AuditToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  action: string
  onActionChange: (value: string) => void
  scope: string
  onScopeChange: (value: string) => void
  totalCount: number
}

export function AuditToolbar({
  search,
  onSearchChange,
  action,
  onActionChange,
  scope,
  onScopeChange,
  totalCount,
}: AuditToolbarProps) {
  return (
    <div className="space-y-3 border-b border-(--border-light) px-4 py-3">
      {/* Top Row: Search & Main Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search events, entity IDs, IP addresses"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-80 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-9 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>
        <select
          value={action}
          onChange={(e) => onActionChange(e.target.value)}
          className="h-9 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-primary"
        >
          <option value="all">All Actions</option>
          <option value="user.create">User Create</option>
          <option value="shop.deactivate">Shop Deactivate</option>
        </select>
        <select className="h-9 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-primary">
          <option>Last 24 Hours (12 Nov 2026)</option>
          <option>Last 7 Days</option>
        </select>
        <select className="h-9 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-primary">
          <option>All Users</option>
        </select>
      </div>

      {/* Bottom Row: Scope filter & Text */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={scope}
          onChange={(e) => onScopeChange(e.target.value)}
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs text-(--text-primary) outline-none focus:border-primary"
        >
          <option value="all">All Scopes (Core & Shop)</option>
          <option value="platform">Platform Core</option>
          <option value="shop">Shop Level</option>
        </select>

        <div className="flex items-center gap-4 text-xs text-(--text-muted)">
          <span>
            Showing{" "}
            <strong className="text-(--text-primary)">{totalCount}</strong> logs
            recorded
          </span>
          {(search || action !== "all" || scope !== "all") && (
            <button
              onClick={() => {
                onSearchChange("")
                onActionChange("all")
                onScopeChange("all")
              }}
              className="flex items-center gap-1 font-medium text-primary hover:underline"
            >
              <X className="size-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
