import { Search } from "lucide-react"
import type { SuperAdminRole, SuperAdminShop } from "../../types/superAdmin"

type UsersToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  roleId: number | undefined
  onRoleChange: (value: number | undefined) => void
  shopId: number | undefined
  onShopChange: (value: number | undefined) => void
  status: "active" | "inactive" | undefined
  onStatusChange: (value: "active" | "inactive" | undefined) => void
  roles: SuperAdminRole[]
  shops: SuperAdminShop[]
  totalCount: number
  onInvite: () => void
  onClearFilters: () => void
}

export function UsersToolbar({
  search,
  onSearchChange,
  roleId,
  onRoleChange,
  shopId,
  onShopChange,
  status,
  onStatusChange,
  roles,
  shops,
  totalCount,
  onClearFilters,
}: UsersToolbarProps) {
  const hasFilters = search || roleId || shopId || status

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search name, email, mobile..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
          />
        </div>

        <select
          value={roleId ?? ""}
          onChange={(e) =>
            onRoleChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.displayName}
            </option>
          ))}
        </select>

        <select
          value={shopId ?? ""}
          onChange={(e) =>
            onShopChange(e.target.value ? Number(e.target.value) : undefined)
          }
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary"
        >
          <option value="">All Shops</option>
          {shops.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={status ?? ""}
          onChange={(e) =>
            onStatusChange(
              (e.target.value || undefined) as "active" | "inactive" | undefined
            )
          }
          className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilters && (
          <button
            onClick={onClearFilters}
            className="text-xs font-medium text-(--text-muted) hover:text-primary"
          >
            Clear Filters
          </button>
        )}
        <span className="ml-2 text-xs text-(--text-muted)">
          Showing {totalCount} users
        </span>
      </div>
    </div>
  )
}
