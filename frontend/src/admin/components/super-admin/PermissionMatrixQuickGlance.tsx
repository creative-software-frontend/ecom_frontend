import { ArrowRight, LayoutGrid } from "lucide-react"

const modules = [
  { name: "Tenants", rules: 6, scope: "Platform Only" },
  { name: "Orders", rules: 12, scope: "Platform & Shop" },
  { name: "Inventory", rules: 8, scope: "Shop Level" },
  { name: "Logistics", rules: 7, scope: "Shop & Hub" },
  { name: "Financials", rules: 9, scope: "Restricted" },
  { name: "Staff & Sec", rules: 6, scope: "Root Control" },
]

export function PermissionMatrixQuickGlance() {
  return (
    <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
            <LayoutGrid className="size-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">
              Module Permission Matrix Quick Glance
            </h3>
            <p className="text-[11px] text-(--text-muted)">
              Core security pillars governing Bangladesh herbal logistics &
              billing gateways
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline">
          Open Granular Matrix Editor <ArrowRight className="size-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {modules.map((mod) => (
          <div
            key={mod.name}
            className="rounded-md border border-(--border-light) bg-(--bg-app) p-3"
          >
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-(--text-primary)">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {mod.name}
            </div>
            <p className="mt-1 text-[11px] text-(--text-muted)">
              {mod.rules} rules defined
            </p>
            <div className="mt-3 inline-block rounded border border-(--border-light) bg-(--bg-surface) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
              {mod.scope}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
