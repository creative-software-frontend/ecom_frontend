import { Search } from "lucide-react"

export function ShopUsersToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
  totalCount,
  roles,
}: {
  search: string
  onSearchChange: (v: string) => void
  role: string
  onRoleChange: (v: string) => void
  status: string
  onStatusChange: (v: string) => void
  totalCount: number
  roles: { name: string; displayName: string }[]
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs outline-none focus:border-(--primary)"
        >
          <option value="all">All Roles</option>
          <option value="shop_admin">Shop Admin</option>
          {roles.map((item) => (
            <option key={item.name} value={item.name}>
              {item.displayName}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs outline-none focus:border-(--primary)"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <span className="text-[11px] text-(--text-muted)">
        Showing {totalCount} users
      </span>
    </div>
  )
}
