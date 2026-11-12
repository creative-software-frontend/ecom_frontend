import { useState } from "react"
import { Download, Settings2 } from "lucide-react"
import { useAdminAuditLogs } from "../../hooks/useAdminUsers"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { AuditMetricsCards } from "../../components/super-admin/AuditMetricsCards"
import { AuditToolbar } from "../../components/super-admin/AuditToolbar"
import { AuditTable } from "../../components/super-admin/AuditTable"

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [action, setAction] = useState("all")
  const [scope, setScope] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [paginationReset, setPaginationReset] = useState(false)

  function resetAuditPage() {
    setPage(1)
    setPaginationReset((reset) => !reset)
  }

  // ফ্লিকার এড়াতে debounce
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useAdminAuditLogs({
    page,
    limit,
    q: debouncedSearch.trim() || undefined,
    action: action !== "all" ? action : undefined,
    // scope: scope !== "all" ? scope : undefined, // ব্যাকএন্ডে scope ফিল্টার থাকলে
  })

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-(--text-primary)">
              Audit Logs
            </h1>
            <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-xs font-medium text-(--text-muted) tabular-nums">
              {(data?.total ?? 0).toLocaleString()} matching events
            </span>
          </div>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Track all user actions, mutations, system operations, and security
            assertions across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Settings2 className="size-4" /> Log Settings
          </button>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-(--primary-hover)">
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Metrics */}
      <AuditMetricsCards />

      {/* Main Content */}
      <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
        <AuditToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            resetAuditPage()
          }}
          action={action}
          onActionChange={(v) => {
            setAction(v)
            resetAuditPage()
          }}
          scope={scope}
          onScopeChange={(v) => {
            setScope(v)
            resetAuditPage()
          }}
          totalCount={data?.total || 0}
        />
        <AuditTable
          items={data?.items || []}
          isLoading={isLoading}
          limit={limit}
          total={data?.total || 0}
          paginationReset={paginationReset}
          onChangePage={setPage}
          onChangeRowsPerPage={(l) => {
            setLimit(l)
            resetAuditPage()
          }}
        />
      </section>
    </div>
  )
}
