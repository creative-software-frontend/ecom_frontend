import DataTable, { type TableColumn } from "react-data-table-component"
import { Download } from "lucide-react"
import { adminDataTableStyles } from "@/admin/lib/dataTableStyles"

type LogRow = {
  id: string
  title: string
  recipients: number
  charged: string
  status: string
  time: string
  cost: string
}

const mockLogs: LogRow[] = [
  {
    id: "1",
    title: "অর্ডার কনফার্মেশন ব্যাচ #1042",
    recipients: 184,
    charged: "184 SMS (1 Part)",
    status: "Delivered 100%",
    time: "Today, 11:20 AM",
    cost: "৳ 46.00",
  },
  {
    id: "2",
    title: "ডেলিভারি নোটিফিকেশন - কুরিয়ার ট্র্যাকিং",
    recipients: 92,
    charged: "184 SMS (2 Parts)",
    status: "Delivered 98.9%",
    time: "Yesterday, 04:45 PM",
    cost: "৳ 46.00",
  },
  {
    id: "3",
    title: "ঈদ স্পেশাল ভাউচার কোড ক্যাম্পেইন",
    recipients: 650,
    charged: "650 SMS (1 Part)",
    status: "Archived",
    time: "12 Oct 2024",
    cost: "৳ 162.50",
  },
]

export function SmsLogsTable() {
  const columns: TableColumn<LogRow>[] = [
    {
      name: "CAMPAIGN / TITLE",
      minWidth: "280px",
      cell: (row) => (
        <div className="flex items-center gap-2 py-2">
          <span className="flex size-2 items-center justify-center rounded-full bg-(--primary)" />
          <span className="text-sm font-medium text-(--text-primary)">
            {row.title}
          </span>
        </div>
      ),
    },
    {
      name: "TARGET RECIPIENTS",
      cell: (row) => (
        <span className="text-xs text-(--text-muted)">
          {row.recipients} Recipients
        </span>
      ),
    },
    {
      name: "SMS CHARGED",
      cell: (row) => (
        <span className="text-xs text-(--text-muted)">{row.charged}</span>
      ),
    },
    {
      name: "STATUS",
      cell: (row) => (
        <span
          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${
            row.status.includes("Delivered")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-(--bg-app) text-(--text-muted)"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      name: "DISPATCH TIME",
      cell: (row) => (
        <span className="text-xs text-(--text-muted)">{row.time}</span>
      ),
    },
    {
      name: "COST",
      right: true,
      cell: (row) => (
        <span className="text-sm font-semibold text-(--text-primary) tabular-nums">
          {row.cost}
        </span>
      ),
    },
  ]

  return (
    <div className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <div className="flex items-center justify-between border-b border-(--border-light) p-4">
        <div>
          <h2 className="text-sm font-semibold text-(--text-primary)">
            Recent SMS Broadcast Logs
          </h2>
          <p className="text-xs text-(--text-muted)">
            Delivery reports dispatched through Dhaka Telecom SMS Hub
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-1.5 text-xs font-medium hover:bg-(--bg-app)">
          <Download className="size-3.5" /> Export Logs
        </button>
      </div>
      <DataTable
        columns={columns}
        data={mockLogs}
        customStyles={adminDataTableStyles}
        pagination={false}
      />
    </div>
  )
}
