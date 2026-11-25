import { useState, useRef, useEffect } from "react"
import {
  MessageCircle,
  Plus,
  Search,
  Send,
  Phone,
  Paperclip,
  Image,
  X,
  CheckCheck,
  Clock,
} from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type TicketStatus = "open" | "answered" | "closed"
type TicketCategory =
  "pickup" | "delivery" | "payment" | "billing" | "service" | "other"

type Message = {
  id: string
  sender: "user" | "support"
  text: string
  time: string
  avatar?: string
}

type Ticket = {
  id: string
  title: string
  preview: string
  status: TicketStatus
  category: string
  createdAt: string
  messages: Message[]
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: "T-1092",
    title: "Payment reconciliation mismatch with bKash",
    preview: "We reconciled payment reconciliation for Order ID #PZ-8891 am...",
    status: "answered",
    category: "Payment & Gateway",
    createdAt: "today at 11:20 AM",
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "We noticed a payment reconciliation mismatch for Order ID #PZ-8891. We completed payment via bKash Checkout (TrxID: BKS961249A), but the automated system is showing a pending capture. Can you please review the transaction log so the invoice reflects as paid?",
        time: "11:20 AM",
      },
      {
        id: "m2",
        sender: "support",
        text: "Thank you for reaching out. We investigated the callback log with bKash and found that an intermittent IPN socket timeout occurred for TrxID BKS961249A and forcibly confirmed Order #PZ-8891 in the store settlement ledger.",
        time: "11:48 AM",
        avatar: "PZ",
      },
    ],
  },
  {
    id: "T-1088",
    title: "Steadfast API consignment issue",
    preview: "Consignment shipment not updating to the Mirpur location...",
    status: "open",
    category: "Courier",
    createdAt: "yesterday at 2:30 PM",
    messages: [
      {
        id: "m3",
        sender: "user",
        text: "Consignment shipment not updating to the Mirpur location properly.",
        time: "2:30 PM",
      },
    ],
  },
  {
    id: "T-1075",
    title: "Delivery charge discrepancy",
    preview: "Checkout shows wrong BDT Gazipur delivery charge...",
    status: "closed",
    category: "Delivery",
    createdAt: "3 days ago",
    messages: [
      {
        id: "m4",
        sender: "user",
        text: "Checkout shows wrong BDT Gazipur delivery charge instead of the configured rate.",
        time: "10:00 AM",
      },
      {
        id: "m5",
        sender: "support",
        text: "This has been resolved. Please clear your cache and try again.",
        time: "11:30 AM",
        avatar: "PZ",
      },
    ],
  },
]

const CATEGORIES: { value: TicketCategory; label: string; icon: string }[] = [
  { value: "pickup", label: "Pickup", icon: "📦" },
  { value: "delivery", label: "Delivery", icon: "🚚" },
  { value: "payment", label: "Payment", icon: "💳" },
  { value: "billing", label: "Billing & charges", icon: "🧾" },
  { value: "service", label: "Service", icon: "⚙️" },
  { value: "other", label: "Other", icon: "💬" },
]

type FilterTab = "all" | TicketStatus

const STATUS_BADGE: Record<TicketStatus, { label: string; className: string }> =
  {
    open: {
      label: "Open",
      className: "bg-amber-100 text-amber-700",
    },
    answered: {
      label: "Answered",
      className: "bg-emerald-100 text-emerald-700",
    },
    closed: {
      label: "Closed",
      className: "bg-gray-100 text-gray-500",
    },
  }

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(
    MOCK_TICKETS[0]?.id ?? null
  )
  const [showNewModal, setShowNewModal] = useState(false)
  const [replyText, setReplyText] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const selectedTicket = tickets.find((t) => t.id === selectedId) ?? null

  const filtered = tickets.filter((t) => {
    const matchesFilter = filter === "all" || t.status === filter
    const matchesSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedId, tickets])

  function handleSendReply() {
    if (!replyText.trim() || !selectedId) return
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedId
          ? {
              ...t,
              messages: [
                ...t.messages,
                {
                  id: `m${Date.now()}`,
                  sender: "user",
                  text: replyText.trim(),
                  time: now,
                },
              ],
            }
          : t
      )
    )
    setReplyText("")
  }

  function handleMarkClosed() {
    if (!selectedId) return
    setTickets((prev) =>
      prev.map((t) => (t.id === selectedId ? { ...t, status: "closed" } : t))
    )
  }

  // const activeCount = tickets.filter((t) => t.status === "open").length

  return (
    <div className="admin-dashboard-content flex h-[calc(100dvh-56px-41px)] flex-col overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between border-b border-(--border-light) bg-white px-6 py-4 print:hidden">
        <div>
          <h1 className="text-lg font-bold text-(--text-primary)">Support</h1>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Your conversations with our support team.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="admin-template-button admin-template-button--secondary flex h-8 items-center gap-1.5 px-3 text-xs"
            onClick={() => window.open("https://wa.me/8801891614300", "_blank")}
          >
            <MessageCircle className="size-3.5" />
            Prefer WhatsApp?
          </button>
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="admin-template-button admin-template-button--primary flex h-8 items-center gap-1.5 px-3 text-xs"
          >
            <Plus className="size-3.5" />
            New ticket
          </button>
        </div>
      </div>

      {/* ── Main Two-Panel Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Ticket List Panel ── */}
        <div className="flex w-80 shrink-0 flex-col border-r border-(--border-light) bg-white lg:w-96">
          {/* Search */}
          <div className="border-b border-(--border-light) px-3 py-3">
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-3.5 text-(--text-muted)" />
              <input
                type="search"
                placeholder="Search tickets"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-3 pl-9 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 border-b border-(--border-light) px-3 py-2">
            {(["all", "open", "answered", "closed"] as FilterTab[]).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filter === tab
                      ? "bg-primary text-white"
                      : "text-(--text-muted) hover:bg-(--bg-app)"
                  }`}
                >
                  {tab === "all"
                    ? "All"
                    : STATUS_BADGE[tab as TicketStatus].label}
                </button>
              )
            )}
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <MessageCircle className="size-8 text-(--text-muted) opacity-40" />
                <div>
                  <p className="text-sm font-medium text-(--text-primary)">
                    No tickets yet
                  </p>
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Open a ticket and our team will reply here.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewModal(true)}
                  className="admin-template-button admin-template-button--primary h-8 px-4 text-xs"
                >
                  New ticket
                </button>
              </div>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedId(ticket.id)}
                  className={`w-full border-b border-(--border-light) px-4 py-3 text-left transition-colors ${
                    selectedId === ticket.id
                      ? "border-l-2 border-l-primary bg-primary/5"
                      : "hover:bg-(--bg-app)"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-primary">
                      #{ticket.id}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-(--text-primary)">
                    {ticket.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-(--text-muted)">
                    {ticket.preview}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Footer helpline */}
          <div className="flex items-center justify-between border-t border-(--border-light) px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-(--text-muted)">
              <Phone className="size-3.5" />
              <span>
                Helpline:{" "}
                <span className="font-semibold text-(--text-primary)">
                  01891614300
                </span>
              </span>
            </div>
            <span className="text-[10px] text-(--text-muted)">
              9 AM – 10 PM
            </span>
          </div>
        </div>

        {/* ── Right: Conversation Panel ── */}
        <div className="flex flex-1 flex-col bg-(--bg-app)">
          {selectedTicket ? (
            <>
              {/* Ticket detail header */}
              <div className="flex items-start justify-between border-b border-(--border-light) bg-white px-6 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      #{selectedTicket.id}
                    </span>
                    <span className="text-xs text-(--text-muted)">–</span>
                    <h2 className="text-sm font-semibold text-(--text-primary)">
                      {selectedTicket.title}
                    </h2>
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-(--text-muted)">
                    Started {selectedTicket.createdAt} · Category:{" "}
                    <span className="font-medium">
                      {selectedTicket.category}
                    </span>
                  </p>
                </div>
                {selectedTicket.status !== "closed" && (
                  <button
                    type="button"
                    onClick={handleMarkClosed}
                    className="admin-template-button admin-template-button--secondary h-8 shrink-0 px-3 text-xs"
                  >
                    Mark Closed
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {selectedTicket.messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              <div className="border-t border-(--border-light) bg-white px-4 py-3">
                <textarea
                  rows={2}
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleSendReply()
                    }
                  }}
                  disabled={selectedTicket.status === "closed"}
                  className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Attach file"
                      disabled={selectedTicket.status === "closed"}
                      className="rounded p-1.5 text-(--text-muted) hover:bg-(--bg-app) disabled:opacity-40"
                    >
                      <Paperclip className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Attach image"
                      disabled={selectedTicket.status === "closed"}
                      className="rounded p-1.5 text-(--text-muted) hover:bg-(--bg-app) disabled:opacity-40"
                    >
                      <Image className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={
                      !replyText.trim() || selectedTicket.status === "closed"
                    }
                    className="admin-template-button admin-template-button--primary flex h-8 items-center gap-1.5 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-(--bg-surface) p-4">
                <MessageCircle className="size-8 text-(--text-muted) opacity-50" />
              </div>
              <p className="text-sm text-(--text-muted)">
                Choose a ticket to see the conversation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── New Ticket Modal ── */}
      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onCreate={(ticket) => {
            setTickets((prev) => [ticket, ...prev])
            setSelectedId(ticket.id)
            setShowNewModal(false)
          }}
          nextId={`T-${1092 + tickets.length + 1}`}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = STATUS_BADGE[status]
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${cfg.className}`}
    >
      {cfg.label}
    </span>
  )
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.sender === "user"

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-xs text-white">
            {message.text}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-(--text-muted)">
            <span>{message.time}</span>
            <CheckCheck className="size-3 text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      {/* Support avatar */}
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
        {message.avatar ?? "PZ"}
      </div>
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-xs text-(--text-primary) shadow-sm">
          {message.text}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-(--text-muted)">
          <Clock className="size-3" />
          <span>{message.time}</span>
        </div>
      </div>
    </div>
  )
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

function NewTicketModal({
  onClose,
  onCreate,
  nextId,
}: {
  onClose: () => void
  onCreate: (ticket: Ticket) => void
  nextId: string
}) {
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [description, setDescription] = useState("")
  const MAX = 1000

  function handleSubmit() {
    if (!category || !description.trim()) return
    const now = new Date().toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
    const cat = CATEGORIES.find((c) => c.value === category)
    onCreate({
      id: nextId,
      title: `${cat?.label ?? "Support"} request`,
      preview: description.trim().slice(0, 80),
      status: "open",
      category: cat?.label ?? "Other",
      createdAt: `today at ${now}`,
      messages: [
        {
          id: `m${Date.now()}`,
          sender: "user",
          text: description.trim(),
          time: now,
        },
      ],
    })
  }

  // Close on backdrop click
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--border-light) px-6 py-4">
          <h2 className="text-base font-semibold text-(--text-primary)">
            New support ticket
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-(--text-muted) hover:bg-(--bg-app)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Category */}
          <div>
            <p className="mb-3 text-sm font-medium text-(--text-primary)">
              What is it about?
            </p>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    category === cat.value
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-(--border-light) text-(--text-muted) hover:border-primary/40 hover:text-(--text-primary)"
                  }`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-(--text-primary)">
              Describe the problem
            </label>
            <textarea
              rows={5}
              maxLength={MAX}
              placeholder="Include parcel IDs, dates and what you expected to happen."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2.5 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-right text-[10px] text-(--text-muted)">
              {description.length} / {MAX}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-(--border-light) px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="admin-template-button admin-template-button--secondary h-9 px-4 text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!category || !description.trim()}
            className="admin-template-button admin-template-button--primary flex h-9 items-center gap-1.5 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="size-3.5" />
            Send ticket
          </button>
        </div>
      </div>
    </div>
  )
}
