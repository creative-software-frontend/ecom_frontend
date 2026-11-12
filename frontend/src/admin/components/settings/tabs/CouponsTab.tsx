import { useMemo, useState } from "react"
import DataTable, { type TableColumn } from "react-data-table-component"
import {
  Plus,
  Search,
  Ticket,
  CheckCircle2,
  PauseCircle,
  Clock,
  MoreVertical,
  Pencil,
  Pause,
  Play,
  Trash2,
  Tag,
} from "lucide-react"
import { SettingsLayout } from "../SettingsLayout"
import { MetricCard } from "../MetricCard"
import type { Coupon, CouponStatus } from "../../../types/coupon"
import { CreateCouponModal } from "../modals/CreateCouponModal"
import { PortalActionMenu } from "../../common/PortalActionMenu"
import { adminDataTableStyles } from "../../../lib/dataTableStyles"

/* ================================================================
   Mock data — replace with API later
   ================================================================ */

const mockCoupons: Coupon[] = [
  {
    id: "c1",
    code: "EID2026",
    discount_type: "percentage",
    discount_value: 20,
    used: 48,
    usage_limit: 200,
    expires_at: "2026-05-15",
    status: "active",
  },
  {
    id: "c2",
    code: "WELCOME10",
    discount_type: "percentage",
    discount_value: 10,
    used: 114,
    usage_limit: null,
    expires_at: null,
    status: "active",
  },
  {
    id: "c3",
    code: "FREESHIP",
    discount_type: "amount",
    discount_value: 120,
    note: "Free Delivery",
    used: 32,
    usage_limit: 50,
    expires_at: "2024-11-30",
    status: "paused",
  },
  {
    id: "c4",
    code: "RAMADAN25",
    discount_type: "amount",
    discount_value: 200,
    used: 100,
    usage_limit: 100,
    expires_at: "2024-04-10",
    status: "expired",
  },
]

/* ================================================================
   Helpers
   ================================================================ */

function formatDiscount(coupon: Coupon): string {
  const base =
    coupon.discount_type === "percentage"
      ? `${coupon.discount_value}% off`
      : `৳${coupon.discount_value.toLocaleString()} off`
  return coupon.note ? `${base} (${coupon.note})` : base
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

/* ================================================================
   CouponStatusChip — custom chip with colored dot
   ================================================================ */

function CouponStatusChip({ status }: { status: CouponStatus }) {
  const config: Record<
    CouponStatus,
    { label: string; bgClass: string; textClass: string }
  > = {
    active: {
      label: "Active",
      bgClass: "bg-(--status-delivered-bg)",
      textClass: "text-(--status-delivered-text)",
    },
    paused: {
      label: "Paused",
      bgClass: "bg-(--status-pending-bg)",
      textClass: "text-(--status-pending-text)",
    },
    expired: {
      label: "Expired",
      bgClass: "bg-(--bg-table-header)",
      textClass: "text-(--text-muted)",
    },
  }
  const c = config[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ${c.bgClass} ${c.textClass}`}
    >
      <span
        className={`size-1.5 rounded-full ${c.textClass.replace("text-", "bg-")}`}
      />
      {c.label}
    </span>
  )
}

/* ================================================================
   UsedCell — usage count + mini progress bar
   Bar color depends on status and usage ratio:
     - Paused → amber
     - Expired → muted
     - Active + >=80% → amber (near limit)
     - Active + <80% → green
   ================================================================ */

function UsedCell({ coupon }: { coupon: Coupon }) {
  const hasLimit = coupon.usage_limit !== null
  const ratio = hasLimit ? coupon.used / coupon.usage_limit! : 0
  const progressPct = hasLimit ? Math.min(100, ratio * 100) : 0

  let barClass = "bg-(--status-delivered-text)" // default green
  if (coupon.status === "paused") barClass = "bg-amber-600"
  else if (coupon.status === "expired") barClass = "bg-(--text-muted)"
  else if (ratio >= 0.8) barClass = "bg-amber-600"

  return (
    <div className="flex items-center gap-2">
      <span className="text-(--text-primary) tabular-nums">
        {coupon.used} / {hasLimit ? coupon.usage_limit : "∞"}
      </span>
      {hasLimit && (
        <div className="h-1 w-10 overflow-hidden rounded-full bg-(--bg-table-header)">
          <div
            className={`h-full ${barClass}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  )
}

/* ================================================================
   ExpiryCell — status takes priority over raw date
   ================================================================ */

function ExpiryCell({ coupon }: { coupon: Coupon }) {
  if (coupon.status === "expired" && coupon.expires_at) {
    return (
      <span className="text-(--text-muted)">
        Expired ({formatDate(coupon.expires_at)})
      </span>
    )
  }
  if (!coupon.expires_at) {
    return <span className="text-(--text-muted)">Ongoing</span>
  }
  return (
    <span className="text-(--text-primary)">
      {formatDate(coupon.expires_at)}
    </span>
  )
}

/* ================================================================
   EmptyState — shown when 0 coupons exist
   ================================================================ */

function CouponsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-lg border-2 border-dashed border-(--border-light) bg-(--bg-surface) px-6 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-lg bg-(--bg-table-header) text-(--text-muted)">
        <Tag className="size-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-(--text-primary)">
        No coupons yet
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-(--text-muted)">
        Create promo discount codes for holidays or returning customers across
        Bangladesh.
      </p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
      >
        <Plus className="size-3.5" />
        Add coupon
      </button>
    </div>
  )
}

/* ================================================================
   CouponsTab
   ================================================================ */

export default function CouponsTab() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Client-side filter by code — swap to server-side search once API is ready
  const filteredCoupons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return mockCoupons
    return mockCoupons.filter((c) => c.code.toLowerCase().includes(q))
  }, [searchQuery])

  // Aggregate counts for the metric cards and the tab badge
  const counts = useMemo(() => {
    return {
      total: mockCoupons.length,
      active: mockCoupons.filter((c) => c.status === "active").length,
      paused: mockCoupons.filter((c) => c.status === "paused").length,
      expired: mockCoupons.filter((c) => c.status === "expired").length,
    }
  }, [])

  function handleMenuAction(
    coupon: Coupon,
    action: "edit" | "toggle" | "delete",
    closeMenu: () => void
  ) {
    closeMenu()
    // TODO: wire these to real mutations once API is available
    console.log(`[${action}] coupon ${coupon.code}`)
  }

  function handleOpenCreate() {
    setShowCreateModal(true)
  }

  const columns: TableColumn<Coupon>[] = [
    {
      name: "Code",
      selector: (coupon) => coupon.code,
      minWidth: "130px",
      cell: (coupon) => (
        <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 font-mono text-xs font-medium text-(--text-primary)">
          {coupon.code}
        </span>
      ),
    },
    {
      name: "Discount",
      selector: (coupon) => coupon.discount_value,
      minWidth: "180px",
      cell: (coupon) => (
        <span className="text-(--text-primary)">{formatDiscount(coupon)}</span>
      ),
    },
    {
      name: "Used",
      selector: (coupon) => coupon.used,
      minWidth: "150px",
      cell: (coupon) => <UsedCell coupon={coupon} />,
    },
    {
      name: "Expires",
      selector: (coupon) => coupon.expires_at ?? "",
      minWidth: "170px",
      cell: (coupon) => <ExpiryCell coupon={coupon} />,
    },
    {
      name: "Status",
      selector: (coupon) => coupon.status,
      width: "120px",
      cell: (coupon) => <CouponStatusChip status={coupon.status} />,
    },
    {
      name: "Actions",
      cell: (coupon) => (
        <PortalActionMenu
          label={`Actions for coupon ${coupon.code}`}
          trigger={<MoreVertical className="size-4" />}
          triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-table-header) hover:text-(--text-primary)"
          menuClassName="w-32"
        >
          {(closeMenu) => (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleMenuAction(coupon, "edit", closeMenu)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleMenuAction(coupon, "toggle", closeMenu)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
              >
                {coupon.status === "active" ? (
                  <>
                    <Pause className="size-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="size-3.5" /> Activate
                  </>
                )}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => handleMenuAction(coupon, "delete", closeMenu)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </>
          )}
        </PortalActionMenu>
      ),
      width: "90px",
      right: true,
    },
  ]

  return (
    <SettingsLayout activeTab="coupons" badges={{ coupons: counts.total }}>
      {/* ---------- Metric cards ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Total Coupons"
          value={counts.total}
          icon={<Ticket className="size-4" />}
          iconBgClass="bg-violet-50"
          iconColorClass="text-violet-600"
        />
        <MetricCard
          label="Active"
          value={counts.active}
          icon={<CheckCircle2 className="size-4" />}
          iconBgClass="bg-(--status-delivered-bg)"
          iconColorClass="text-(--status-delivered-text)"
          showDot
        />
        <MetricCard
          label="Paused"
          value={counts.paused}
          icon={<PauseCircle className="size-4" />}
          iconBgClass="bg-(--status-pending-bg)"
          iconColorClass="text-(--status-pending-text)"
          showDot
        />
        <MetricCard
          label="Expired"
          value={counts.expired}
          icon={<Clock className="size-4" />}
          iconBgClass="bg-(--bg-table-header)"
          iconColorClass="text-(--text-muted)"
          showDot
        />
      </div>

      {/* ---------- All coupons card ---------- */}
      {mockCoupons.length === 0 ? (
        <CouponsEmptyState onAdd={handleOpenCreate} />
      ) : (
        <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
          {/* Header: title + search + add */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-(--text-primary)">
                All coupons
              </h2>
              <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-xs font-medium text-(--text-muted) tabular-nums">
                {counts.total} total
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-(--text-muted)" />
                <input
                  type="search"
                  placeholder="Search by code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-52 rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium whitespace-nowrap text-white transition-colors hover:bg-(--primary-hover)"
              >
                <Plus className="size-3.5" />
                Add coupon
              </button>
            </div>
          </div>

          {/* Table */}
          <DataTable
            className="admin-data-table"
            keyField="id"
            columns={columns}
            data={filteredCoupons}
            customStyles={adminDataTableStyles}
            pagination={false}
            responsive
            noDataComponent={
              <p className="px-4 py-10 text-center text-xs text-(--text-muted)">
                No coupons match "{searchQuery}".
              </p>
            }
          />

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-light) px-4 py-2.5 text-xs text-(--text-muted)">
            <span>
              Showing {filteredCoupons.length} of {counts.total} coupons
            </span>
            <span>Auto-applied discounts: 0</span>
          </div>
        </section>
      )}

      {/* Create-coupon modal */}
      <CreateCouponModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(coupon) => {
          // TODO: refresh list from API — e.g. queryClient.invalidateQueries
          console.log("Coupon created:", coupon.code)
        }}
      />
    </SettingsLayout>
  )
}
