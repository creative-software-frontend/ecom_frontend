import { useState } from "react"
import { ArrowLeft, CheckCircle2, Search, X } from "lucide-react"
import { Link } from "react-router"
import {
  useAdminShopsPaginated,
  useUpdateShopMutation,
} from "../../hooks/useAdminUsers"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { ShopsTable } from "../../components/super-admin/ShopsTable"
import { EditShopDrawer } from "@/admin/components/super-admin/EditShopDrawer"
import { ConfirmToggleShopDialog } from "@/admin/components/super-admin/ConfirmToggleShopDialog"
import type { SuperAdminShopListItem } from "@/admin/types/superAdmin"
import { getErrorMessage } from "@/admin/lib/errors"

export default function AllShopsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useAdminShopsPaginated({
    q: debouncedSearch.trim() || undefined,
    status: status !== "all" ? status : undefined,
  })
  const updateMutation = useUpdateShopMutation()

  const [editShop, setEditShop] = useState<SuperAdminShopListItem | null>(null)
  const [toggleTarget, setToggleTarget] =
    useState<SuperAdminShopListItem | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleToggleConfirm() {
    if (!toggleTarget) return
    const next = toggleTarget.status === "active" ? "inactive" : "active"
    setToggleError(null)
    updateMutation.mutate(
      { id: toggleTarget.id, data: { status: next } },
      {
        onSuccess: () => {
          setSuccessMessage(
            next === "active"
              ? `${toggleTarget.name} is now active.`
              : `${toggleTarget.name} has been suspended.`
          )
          setToggleTarget(null)
        },
        onError: (err) => {
          setToggleError(getErrorMessage(err, "Failed to update shop status"))
        },
      }
    )
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      <Link
        to="/admin/shops"
        className="inline-flex items-center gap-2 text-sm font-medium text-(--text-muted) transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to shops
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-(--text-primary)">All Shops</h1>
          {data && (
            <span className="rounded-full bg-(--primary-soft) px-2 py-0.5 text-xs font-semibold text-(--primary)">
              {data.total} total
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-(--text-muted)">
          Search, filter and manage every shop on the platform.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {successMessage}
          </span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="rounded p-1 hover:bg-(--status-delivered-bg)"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Table Area */}
      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
              <input
                type="search"
                placeholder="Search shop name, slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-64 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 rounded-md border border-(--border-light) bg-(--bg-surface) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="inactive">Suspended</option>
            </select>
          </div>
        </div>

        <ShopsTable
          items={data?.items || []}
          isLoading={isLoading}
          onEdit={(s) => setEditShop(s)}
          onToggleStatus={(s) => {
            setToggleTarget(s)
            setToggleError(null)
          }}
        />
      </section>

      {/* Modals */}
      <EditShopDrawer
        open={editShop !== null}
        shop={editShop}
        onClose={() => setEditShop(null)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <ConfirmToggleShopDialog
        open={toggleTarget !== null}
        shopName={toggleTarget?.name ?? ""}
        currentStatus={toggleTarget?.status ?? "active"}
        nextStatus={toggleTarget?.status === "active" ? "inactive" : "active"}
        isPending={updateMutation.isPending}
        errorMessage={toggleError}
        onCancel={() => {
          setToggleTarget(null)
          setToggleError(null)
        }}
        onConfirm={handleToggleConfirm}
      />
    </div>
  )
}
