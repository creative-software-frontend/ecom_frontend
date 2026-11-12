import { useState } from "react"
import { Plus, Search, Download } from "lucide-react"
import { useAdminShopsPaginated } from "../../hooks/useAdminUsers"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { ShopsMetricsCards } from "../../components/super-admin/ShopsMetricsCards"
import { ShopsTable } from "../../components/super-admin/ShopsTable"
import { StoreDensityCard } from "@/admin/components/super-admin/StoreDensityCard"
import { TopVerticalsCard } from "@/admin/components/super-admin/TopVerticalsCard"

export default function ShopsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useAdminShopsPaginated({
    q: debouncedSearch.trim() || undefined,
    status: status !== "all" ? status : undefined,
  })

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">Shops</h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Manage multi-tenant shops, subscriptions, and active statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Download className="size-4" /> Export CSV
          </button>
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white hover:bg-(--primary-hover)">
            <Plus className="size-4" /> Add Shop
          </button>
        </div>
      </div>

      {/* Metrics */}
      {data && <ShopsMetricsCards counts={data.counts} />}

      {/* Table Area */}
      <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="search"
                placeholder="Search shop name, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) outline-none focus:border-primary"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="inactive">Suspended</option>
            </select>
            {/* Plan Filter (Dummy UI for now) */}
            <select className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-primary">
              <option>Plan Tier: All</option>
              <option>Enterprise</option>
              <option>Growth</option>
            </select>
          </div>
        </div>

        <ShopsTable items={data?.items || []} isLoading={isLoading} />
      </section>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StoreDensityCard />
        <TopVerticalsCard />
      </div>
    </div>
  )
}
