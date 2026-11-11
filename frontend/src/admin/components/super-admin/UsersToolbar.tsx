import { Search, Plus } from "lucide-react"
import type { SuperAdminRole } from "../../types/superAdmin"

type UsersToolbarProps = {
  search: string
  onSearchChange: (value: string) => void
  roleId: number | undefined
  onRoleChange: (value: number | undefined) => void
  status: "active" | "inactive" | undefined
  onStatusChange: (value: "active" | "inactive" | undefined) => void
  roles: SuperAdminRole[]
  onInvite: () => void
}

export function UsersToolbar({
  search,
  onSearchChange,
  roleId,
  onRoleChange,
  status,
  onStatusChange,
  roles,
  onInvite,
}: UsersToolbarProps) {
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
      </div>

      <button
        type="button"
        onClick={onInvite}
        className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
      >
        <Plus className="size-3.5" />
        Add user
      </button>
    </div>
  )
}
