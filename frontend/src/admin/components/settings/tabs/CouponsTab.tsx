import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import type {
  Coupon,
  CouponCounts,
  CouponEditableStatus,
  CouponStatus,
} from "../../../types/coupon"
import { couponsApi, couponQueryKeys } from "../../../api/couponsApi"
import { CreateCouponModal } from "../modals/CreateCouponModal"
import { formatDate } from "../../../lib/formatTime"
import { formatTaka } from "../../../lib/orderStatus"
import { PortalActionMenu } from "../../common/PortalActionMenu"
import { ConfirmationDialog } from "../../common/ConfirmationDialog"
import { InlineNotice } from "../../common/InlineNotice"
import { LoadingState } from "../../common/LoadingState"
import { ErrorState } from "../../common/ErrorState"
import { useDebouncedValue } from "../../../hooks/useDebouncedValue"
import { adminDataTableStyles } from "../../../lib/dataTableStyles"

const EMPTY_COUNTS: CouponCounts = {
  total: 0,
  active: 0,
  paused: 0,
  expired: 0,
}

type Notice = { tone: "success" | "error"; message: string }

/* ================================================================
   Helpers
   ================================================================ */

function formatDiscount(coupon: Coupon): string {
  const base =
    coupon.discountType === "percentage"
      ? `${coupon.discountValue}% off`
      : `${formatTaka(coupon.discountValue)} off`
  return coupon.note ? `${base} (${coupon.note})` : base
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
   ================================================================ */

function UsedCell({ coupon }: { coupon: Coupon }) {
  const hasLimit = coupon.usageLimit !== null
  const ratio = coupon.usageLimit !== null ? coupon.used / coupon.usageLimit : 0
  const progressPct = hasLimit ? Math.min(100, ratio * 100) : 0

  let barClass = "bg-(--status-delivered-text)"
  if (coupon.status === "paused") barClass = "bg-(--status-pending-text)"
  else if (coupon.status === "expired") barClass = "bg-(--text-muted)"
  else if (ratio >= 0.8) barClass = "bg-(--status-pending-text)"

  return (
    <div className="flex items-center gap-2">
      <span className="text-(--text-primary) tabular-nums">
        {coupon.used} / {hasLimit ? coupon.usageLimit : "∞"}
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
  if (coupon.status === "expired" && coupon.expiresAt) {
    return (
      <span className="text-(--text-muted)">
        Expired ({formatDate(coupon.expiresAt)})
      </span>
    )
  }
  if (!coupon.expiresAt) {
    return <span className="text-(--text-muted)">Ongoing</span>
  }
  return (
    <span className="text-(--text-primary)">
      {formatDate(coupon.expiresAt)}
    </span>
  )
}

/* ================================================================
   CouponsEmptyState — shown when 0 coupons exist
   ================================================================ */

function CouponsEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-md border-2 border-dashed border-(--border-light) bg-(--bg-surface) px-6 py-12 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-md bg-(--bg-table-header) text-(--text-muted)">
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
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null)
  const [deleteNoticeDismissed, setDeleteNoticeDismissed] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)

  const couponsQuery = useQuery({
    queryKey: couponQueryKeys.list({ q: debouncedSearch }),
    queryFn: ({ signal }) => couponsApi.list({ q: debouncedSearch }, signal),
  })

  const coupons = couponsQuery.data?.items ?? []
  const counts = couponsQuery.data?.counts ?? EMPTY_COUNTS

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: CouponEditableStatus
    }) => couponsApi.updateStatus(id, { status }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all })
      setNotice({
        tone: "success",
        message: `Coupon ${updated.code} is now ${updated.status}.`,
      })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not update the coupon status",
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (coupon: Coupon) => couponsApi.remove(coupon.id),
    onSuccess: (_data, coupon) => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all })
      setDeletingCoupon(null)
      setNotice({
        tone: "success",
        message: `Coupon ${coupon.code} deleted.`,
      })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "Could not delete the coupon",
      })
    },
  })

  function openCreate() {
    setEditingCoupon(null)
    setModalOpen(true)
  }

  function openEdit(coupon: Coupon) {
    setEditingCoupon(coupon)
    setModalOpen(true)
  }

  function handleMenuAction(
    coupon: Coupon,
    action: "edit" | "toggle" | "delete",
    closeMenu: () => void
  ) {
    closeMenu()

    if (action === "edit") {
      openEdit(coupon)
      return
    }

    if (action === "delete") {
      setNotice(null)
      setDeleteNoticeDismissed(false)
      setDeletingCoupon(coupon)
      return
    }

    const nextStatus: CouponEditableStatus =
      coupon.status === "active" ? "paused" : "active"
    if (coupon.status === "expired" && nextStatus === "active") return
    setNotice(null)
    statusMutation.mutate({ id: coupon.id, status: nextStatus })
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
      selector: (coupon) => coupon.discountValue,
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
      selector: (coupon) => coupon.expiresAt ?? "",
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
          menuClassName="w-36"
        >
          {(closeMenu) => {
            const isActivateExpired = coupon.status === "expired"
            return (
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
                  disabled={isActivateExpired}
                  title={
                    isActivateExpired
                      ? "Extend expiry date via Edit to reactivate"
                      : undefined
                  }
                  onClick={() => handleMenuAction(coupon, "toggle", closeMenu)}
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover) disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--status-cancelled-text) transition-colors hover:bg-(--status-cancelled-bg)"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              </>
            )
          }}
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
          iconBgClass="bg-(--primary-soft)"
          iconColorClass="text-primary"
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

      {notice && (
        <InlineNotice
          variant={notice.tone}
          ariaLive={notice.tone === "error" ? "assertive" : "polite"}
          message={notice.message}
          dismissLabel="Dismiss"
          onDismiss={() => setNotice(null)}
          className={
            notice.tone === "success"
              ? "flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg) px-3 py-2 text-xs font-medium text-(--status-delivered-text)"
              : "flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs font-medium text-(--status-cancelled-text)"
          }
          dismissClassName="rounded px-1 text-current hover:bg-(--bg-surface-hover)"
        />
      )}

      {couponsQuery.isPending ? (
        <LoadingState
          className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
          ariaLabel="Loading coupons"
        >
          Loading coupons…
        </LoadingState>
      ) : couponsQuery.isError ? (
        <ErrorState
          message={
            couponsQuery.error instanceof Error
              ? couponsQuery.error.message
              : "Could not load coupons"
          }
          onRetry={() => void couponsQuery.refetch()}
          className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
          buttonClassName="mt-2 rounded-md border border-(--border-light) px-3 py-1.5 text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
          role="alert"
        />
      ) : counts.total === 0 ? (
        <CouponsEmptyState onAdd={openCreate} />
      ) : (
        /* ---------- All coupons card ---------- */
        <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
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
                onClick={openCreate}
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
            data={coupons}
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
              Showing {coupons.length} of {counts.total} coupons
            </span>
            <span>{counts.active} active</span>
          </div>
        </section>
      )}

      {/* Create / edit coupon modal */}
      <CreateCouponModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        coupon={editingCoupon}
        onSaved={(saved) =>
          setNotice({
            tone: "success",
            message: `Coupon ${saved.code} saved.`,
          })
        }
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deletingCoupon !== null}
        title="Delete coupon?"
        description={
          deletingCoupon ? (
            <>
              Delete <strong>{deletingCoupon.code}</strong>? This action cannot
              be undone.
            </>
          ) : null
        }
        variant="danger"
        icon={Trash2}
        confirmLabel="Delete coupon"
        isPending={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError && deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : null
        }
        notice={
          deletingCoupon &&
          deletingCoupon.used > 0 &&
          !deleteNoticeDismissed ? (
            <InlineNotice
              variant="error"
              message={`This coupon has been used ${deletingCoupon.used} time(s). Used coupons cannot be deleted; pause it instead.`}
              dismissLabel="Dismiss"
              onDismiss={() => setDeleteNoticeDismissed(true)}
              className="flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
              dismissClassName="rounded px-1 text-(--status-cancelled-text)"
            />
          ) : null
        }
        onCancel={() => {
          if (deleteMutation.isPending) return
          setDeletingCoupon(null)
          deleteMutation.reset()
        }}
        onConfirm={() => {
          if (deletingCoupon) deleteMutation.mutate(deletingCoupon)
        }}
      />
    </SettingsLayout>
  )
}
