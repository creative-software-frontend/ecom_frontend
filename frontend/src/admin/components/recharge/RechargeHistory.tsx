import { useMemo, useState } from "react"
import DataTable, { type TableColumn } from "react-data-table-component"
import { Copy, Check, Wallet } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { formatOrderDate, formatTaka } from "../../lib/orderStatus"
import { MOCK_RECHARGE_RECORDS } from "../../data/rechargeHistoryMock"
import type {
  RechargePurpose,
  RechargeRecord,
  RechargeStatus,
} from "../../types/recharge"

const statusConfig: Record<
  RechargeStatus,
  { label: string; className: string; dot: string }
> = {
  success: {
    label: "Success",
    className: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  expired: {
    label: "Expired",
    className: "bg-(--bg-table-header) text-(--text-muted)",
    dot: "bg-(--text-muted)",
  },
}

const methodLabels: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  qr: "QR",
}

function StatusChip({ status }: { status: RechargeStatus }) {
  const cfg = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}
    >
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

function TrxCell({ trxId }: { trxId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trxId)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable — silent fail.
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="font-mono text-xs tracking-wide text-(--text-primary)">
        {trxId}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded p-0.5 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
        aria-label="Copy transaction ID"
      >
        {copied ? (
          <Check className="size-3 text-emerald-600" />
        ) : (
          <Copy className="size-3" />
        )}
      </button>
    </div>
  )
}

type RechargeHistoryProps = {
  purpose: RechargePurpose
  title?: string
  description?: string
}

export function RechargeHistory({
  purpose,
  title = "Recharge History",
  description,
}: RechargeHistoryProps) {
  const records = useMemo(
    () => MOCK_RECHARGE_RECORDS.filter((r) => r.purpose === purpose),
    [purpose]
  )

  const [statusFilter, setStatusFilter] = useState<"all" | RechargeStatus>(
    "all"
  )
  const [search, setSearch] = useState("")

  const counts = useMemo(
    () => ({
      all: records.length,
      success: records.filter((r) => r.status === "success").length,
      pending: records.filter((r) => r.status === "pending").length,
      failed: records.filter(
        (r) => r.status === "failed" || r.status === "expired"
      ).length,
    }),
    [records]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records
      .filter((r) => {
        if (statusFilter === "success" && r.status !== "success") return false
        if (statusFilter === "pending" && r.status !== "pending") return false
        if (
          statusFilter === "failed" &&
          r.status !== "failed" &&
          r.status !== "expired"
        )
          return false
        if (q) {
          if (
            !r.trxId.toLowerCase().includes(q) &&
            !r.amount.toString().includes(q)
          ) {
            return false
          }
        }
        return true
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [records, statusFilter, search])

  const successTotal = records
    .filter((r) => r.status === "success")
    .reduce((sum, r) => sum + r.amount, 0)

  const columns: TableColumn<RechargeRecord>[] = [
    {
      name: "DATE",
      minWidth: "150px",
      cell: (row) => (
        <span className="text-xs text-(--text-muted) tabular-nums">
          {formatOrderDate(row.createdAt)}
        </span>
      ),
    },
    {
      name: "TRANSACTION ID",
      minWidth: "160px",
      cell: (row) => <TrxCell trxId={row.trxId} />,
    },
    {
      name: "METHOD",
      width: "110px",
      cell: (row) => (
        <span className="text-xs font-medium text-(--text-primary)">
          {methodLabels[row.method] ?? row.method}
        </span>
      ),
    },
    {
      name: "AMOUNT",
      width: "120px",
      right: true,
      cell: (row) => (
        <span className="text-sm font-semibold text-(--text-primary) tabular-nums">
          {formatTaka(row.amount)}
        </span>
      ),
    },
    {
      name: "STATUS",
      width: "120px",
      cell: (row) => <StatusChip status={row.status} />,
    },
    {
      name: "NOTE",
      minWidth: "180px",
      cell: (row) =>
        row.note ? (
          <span className="text-xs text-(--text-muted)">{row.note}</span>
        ) : (
          <span className="text-xs text-(--text-muted) italic opacity-60">
            —
          </span>
        ),
    },
  ]

  return (
    <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) px-5 py-4">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-(--primary)" />
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              {title}
            </h2>
            {description && (
              <p className="text-[11px] text-(--text-muted)">{description}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-(--text-muted)">
          Total recharged:{" "}
          <strong className="font-semibold text-(--text-primary) tabular-nums">
            {formatTaka(successTotal)}
          </strong>
        </span>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--border-light) bg-(--bg-table-header) px-4 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {(["all", "success", "pending", "failed"] as const).map((key) => {
            const label =
              key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)
            const count = counts[key]
            const isActive = statusFilter === key
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-(--primary) text-white"
                    : "text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
                }`}
              >
                {label} <span className="ml-1 opacity-75">({count})</span>
              </button>
            )
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search TrxID or amount"
          className="h-8 w-56 rounded-md border border-(--border-light) bg-(--bg-surface) px-2.5 text-xs text-(--text-primary) transition-all outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
        />
      </div>

      {/* Table or empty */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <Wallet className="size-8 text-(--text-muted) opacity-50" />
          <p className="text-sm font-medium text-(--text-primary)">
            No recharge records yet
          </p>
          <p className="text-xs text-(--text-muted)">
            Your recharge history will appear here once you submit a payment.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-(--text-primary)">
            No records match your filters
          </p>
          <p className="text-xs text-(--text-muted)">
            Try changing the status filter or search query.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          customStyles={adminDataTableStyles}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50]}
        />
      )}
    </section>
  )
}
