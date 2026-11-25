import { Settings2 } from "lucide-react"
import type { CourierService, OrderSource, TeamMember } from "../../types/order"

type OrderDetailsCardProps = {
  teamMembers: TeamMember[]
  assignTo: string
  onAssignToChange: (id: string) => void
  /** Platform-created orders may deliberately have no assignee. */
  allowUnassigned?: boolean
  couriers: CourierService[]
  courier: string
  onCourierChange: (id: string) => void
  sources: OrderSource[]
  source: string
  onSourceChange: (id: string) => void
}

export function OrderDetailsCard({
  teamMembers,
  assignTo,
  onAssignToChange,
  allowUnassigned = false,
  couriers,
  courier,
  onCourierChange,
  sources,
  source,
  onSourceChange,
}: OrderDetailsCardProps) {
  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-4">
        <Settings2 className="size-4 text-(--primary)" />
        <h2 className="text-sm font-semibold text-(--text-primary)">
          Order Details
        </h2>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Assign To
          </label>
          <select
            value={assignTo}
            onChange={(e) => onAssignToChange(e.target.value)}
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          >
            {allowUnassigned && <option value="">Unassigned</option>}
            {teamMembers.map((m) => (
              <option key={m.id} value={String(m.id)}>
                {m.name}
                {m.role ? ` — ${m.role}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Courier
          </label>
          <select
            value={courier}
            onChange={(e) => onCourierChange(e.target.value)}
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          >
            <option value="">Select Courier</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-(--text-primary)">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => onSourceChange(e.target.value)}
            className="h-10 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
          >
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  )
}
