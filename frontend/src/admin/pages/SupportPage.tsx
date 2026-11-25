import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CheckCheck,
  Clock,
  Image,
  MessageCircle,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
} from "lucide-react"
import {
  shopSupportApi,
  shopSupportQueryKeys,
  TICKET_CATEGORIES,
  type CreateTicketInput,
  type SupportMessageDto,
  type TicketCategory,
  type TicketStatus,
} from "../api/supportApi"
import { ConfirmationDialog } from "../components/common/ConfirmationDialog"
import { DialogShell } from "../components/common/DialogShell"
import { ErrorState } from "../components/common/ErrorState"
import { InlineNotice } from "../components/common/InlineNotice"
import { LoadingState } from "../components/common/LoadingState"
import { StatusBadge } from "../components/common/StatusBadge"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { getErrorMessage } from "../lib/errors"
import { formatTimestamp, relativeTime } from "../lib/formatTime"

type Notice = { tone: "success" | "error"; message: string }
type FilterTab = TicketStatus | "all"

const CATEGORY_META: Record<
  TicketCategory,
  { label: string; icon: string }
> = {
  pickup: { label: "Pickup", icon: "📦" },
  delivery: { label: "Delivery", icon: "🚚" },
  payment: { label: "Payment", icon: "💳" },
  billing: { label: "Billing & charges", icon: "🧾" },
  service: { label: "Service", icon: "⚙️" },
  other: { label: "Other", icon: "💬" },
}

const STATUS_VARIANT: Record<
  TicketStatus,
  "warning" | "success" | "inactive"
> = {
  open: "warning",
  answered: "success",
  closed: "inactive",
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "answered", label: "Answered" },
  { value: "closed", label: "Closed" },
]

const noticeClassName = (tone: Notice["tone"]) =>
  tone === "error"
    ? "flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-4 py-2 text-xs text-(--status-cancelled-text)"
    : "flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2 text-xs text-(--status-delivered-text)"

export default function SupportPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showNewModal, setShowNewModal] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)
  const [confirmClose, setConfirmClose] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const listParams = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      status: filter,
    }),
    [debouncedSearch, filter]
  )

  const listQuery = useQuery({
    queryKey: shopSupportQueryKeys.list(listParams),
    queryFn: ({ signal }) => shopSupportApi.list(listParams, signal),
    placeholderData: (previous) => previous,
  })

  const items = listQuery.data?.items ?? []
  const counts = listQuery.data?.counts ?? {
    total: 0,
    open: 0,
    answered: 0,
    closed: 0,
  }

  // Auto-select the first visible ticket; clear a selection that was filtered out.
  useEffect(() => {
    if (items.length === 0) {
      if (selectedId !== null) setSelectedId(null)
      return
    }
    if (selectedId === null || !items.some((ticket) => ticket.id === selectedId)) {
      setSelectedId(items[0]!.id)
    }
  }, [items, selectedId])

  const detailQuery = useQuery({
    queryKey: shopSupportQueryKeys.detail(selectedId ?? 0),
    queryFn: ({ signal }) => {
      if (selectedId === null) throw new Error("Missing ticket id")
      return shopSupportApi.get(selectedId, signal)
    },
    enabled: selectedId !== null,
  })
  const ticket = detailQuery.data ?? null

  const createMutation = useMutation({
    mutationFn: (input: CreateTicketInput) => shopSupportApi.create(input),
    onSuccess: (created) => {
      setCreateError(null)
      setShowNewModal(false)
      setFilter("all")
      setSearch("")
      setSelectedId(created.id)
      void queryClient.invalidateQueries({ queryKey: shopSupportQueryKeys.all })
      setNotice({
        tone: "success",
        message: `Ticket #${created.ticketNumber} created.`,
      })
    },
    onError: (error) => {
      setCreateError(getErrorMessage(error, "Failed to create the ticket."))
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({
      id,
      message,
    }: {
      id: number
      message: string
    }) => shopSupportApi.reply(id, message),
    onSuccess: () => {
      setReplyText("")
      void queryClient.invalidateQueries({ queryKey: shopSupportQueryKeys.all })
      setNotice({ tone: "success", message: "Reply sent." })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to send the reply."),
      })
    },
  })

  const closeMutation = useMutation({
    mutationFn: (id: number) => shopSupportApi.close(id),
    onSuccess: () => {
      setConfirmClose(false)
      void queryClient.invalidateQueries({ queryKey: shopSupportQueryKeys.all })
      setNotice({ tone: "success", message: "Ticket closed." })
    },
    onError: (error) => {
      setConfirmClose(false)
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to close the ticket."),
      })
    },
  })

  const messageCount = ticket?.messages.length ?? 0
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedId, messageCount])

  function handleSendReply() {
    const message = replyText.trim()
    if (!message || ticket === null || ticket.status === "closed") return
    replyMutation.mutate({ id: ticket.id, message })
  }

  function openNewTicket() {
    setCreateError(null)
    setNotice(null)
    setShowNewModal(true)
  }

  function tabCount(tab: FilterTab) {
    if (tab === "all") return counts.total
    return counts[tab]
  }

  return (
    <div className="admin-dashboard-content flex h-[calc(100dvh-56px-41px)] flex-col overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between border-b border-(--border-light) bg-(--bg-surface) px-6 py-4 print:hidden">
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
            onClick={openNewTicket}
            className="admin-template-button admin-template-button--primary flex h-8 items-center gap-1.5 px-3 text-xs"
          >
            <Plus className="size-3.5" />
            New ticket
          </button>
        </div>
      </div>

      {notice && (
        <div className="border-b border-(--border-light) bg-(--bg-surface) px-6 py-2">
          <InlineNotice
            message={notice.message}
            variant={notice.tone}
            ariaLive={notice.tone === "error" ? "assertive" : "polite"}
            dismissLabel="Dismiss notification"
            onDismiss={() => setNotice(null)}
            className={noticeClassName(notice.tone)}
            dismissClassName="text-xs font-medium hover:underline"
          />
        </div>
      )}

      {/* ── Main Two-Panel Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left: Ticket List Panel ── */}
        <div className="flex w-80 shrink-0 flex-col border-r border-(--border-light) bg-(--bg-surface) lg:w-96">
          <div className="border-b border-(--border-light) px-3 py-3">
            <label className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-3.5 text-(--text-muted)" />
              <input
                type="search"
                placeholder="Search tickets"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-8 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-3 pl-9 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </label>
          </div>

          <div className="flex gap-1 border-b border-(--border-light) px-3 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setFilter(tab.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === tab.value
                    ? "bg-primary text-white"
                    : "text-(--text-muted) hover:bg-(--bg-app)"
                }`}
              >
                {tab.label} <span className="tabular-nums">{tabCount(tab.value)}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            {listQuery.isLoading ? (
              <LoadingState
                className="flex justify-center px-4 py-16 text-xs text-(--text-muted)"
                ariaLabel="Loading tickets"
              >
                Loading tickets…
              </LoadingState>
            ) : listQuery.error ? (
              <ErrorState
                className="space-y-3 px-4 py-12 text-center"
                messageClassName="text-xs text-(--text-muted)"
                buttonClassName="admin-template-button admin-template-button--secondary h-8 px-3 text-xs"
                message={getErrorMessage(listQuery.error, "Could not load tickets.")}
                onRetry={() => void listQuery.refetch()}
              />
            ) : items.length === 0 ? (
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
                  onClick={openNewTicket}
                  className="admin-template-button admin-template-button--primary h-8 px-4 text-xs"
                >
                  New ticket
                </button>
              </div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full border-b border-(--border-light) px-4 py-3 text-left transition-colors ${
                    selectedId === item.id
                      ? "border-l-2 border-l-primary bg-primary/5"
                      : "hover:bg-(--bg-app)"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-primary">
                      #{item.ticketNumber}
                    </span>
                    <StatusBadge
                      variant={STATUS_VARIANT[item.status]}
                      label={item.status}
                    />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-medium text-(--text-primary)">
                    {item.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] text-(--text-muted)">
                    {item.preview ?? "No messages"}
                  </p>
                </button>
              ))
            )}
          </div>

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
            <span className="text-[10px] text-(--text-muted)">9 AM – 10 PM</span>
          </div>
        </div>

        {/* ── Right: Conversation Panel ── */}
        <div className="flex flex-1 flex-col bg-(--bg-app)">
          {ticket === null ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-(--bg-surface) p-4">
                <MessageCircle className="size-8 text-(--text-muted) opacity-50" />
              </div>
              <p className="text-sm text-(--text-muted)">
                {selectedId === null
                  ? "Choose a ticket to see the conversation."
                  : "Loading ticket…"}
              </p>
            </div>
          ) : detailQuery.isLoading ? (
            <LoadingState
              className="flex flex-1 items-center justify-center text-sm text-(--text-muted)"
              ariaLabel="Loading conversation"
            >
              Loading conversation…
            </LoadingState>
          ) : detailQuery.error ? (
            <ErrorState
              className="m-6 space-y-3 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
              messageClassName="text-sm text-(--text-muted)"
              buttonClassName="admin-template-button admin-template-button--secondary h-8 px-3 text-xs"
              message={getErrorMessage(detailQuery.error, "Could not load this ticket.")}
              onRetry={() => void detailQuery.refetch()}
            />
          ) : (
            <>
              <div className="flex items-start justify-between border-b border-(--border-light) bg-(--bg-surface) px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      #{ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-(--text-muted)">–</span>
                    <h2 className="text-sm font-semibold text-(--text-primary)">
                      {ticket.title}
                    </h2>
                    <StatusBadge
                      variant={STATUS_VARIANT[ticket.status]}
                      label={ticket.status}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-(--text-muted)">
                    Started {formatTimestamp(ticket.createdAt)} · Category:{" "}
                    <span className="font-medium">
                      {CATEGORY_META[ticket.category].label}
                    </span>
                  </p>
                </div>
                {ticket.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => setConfirmClose(true)}
                    className="admin-template-button admin-template-button--secondary h-8 shrink-0 px-3 text-xs"
                  >
                    Mark Closed
                  </button>
                )}
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {ticket.messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-(--border-light) bg-(--bg-surface) px-4 py-3">
                <textarea
                  rows={2}
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      handleSendReply()
                    }
                  }}
                  disabled={ticket.status === "closed" || replyMutation.isPending}
                  className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                {ticket.status === "closed" && (
                  <p className="mt-1 text-[11px] text-(--text-muted)">
                    This ticket is closed.
                  </p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Attachments coming soon"
                      disabled
                      className="rounded p-1.5 text-(--text-muted) opacity-40"
                    >
                      <Paperclip className="size-4" />
                    </button>
                    <button
                      type="button"
                      title="Attachments coming soon"
                      disabled
                      className="rounded p-1.5 text-(--text-muted) opacity-40"
                    >
                      <Image className="size-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReply}
                    disabled={
                      !replyText.trim() ||
                      ticket.status === "closed" ||
                      replyMutation.isPending
                    }
                    className="admin-template-button admin-template-button--primary flex h-8 items-center gap-1.5 px-4 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    Send Reply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewTicketModal
          onClose={() => setShowNewModal(false)}
          onCreate={(input) => createMutation.mutate(input)}
          isPending={createMutation.isPending}
          errorMessage={createError}
          onDismissError={() => setCreateError(null)}
        />
      )}

      <ConfirmationDialog
        open={confirmClose}
        title="Close this ticket?"
        description={
          <>
            Close <strong>#{ticket?.ticketNumber}</strong>? You won&apos;t be able
            to reply until support reopens it.
          </>
        }
        variant="warning"
        icon={CheckCheck}
        confirmLabel="Close ticket"
        isPending={closeMutation.isPending}
        onCancel={() => setConfirmClose(false)}
        onConfirm={() => {
          if (ticket) closeMutation.mutate(ticket.id)
        }}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: SupportMessageDto }) {
  const isShop = message.senderType === "shop"
  const time = formatTimestamp(message.createdAt)

  if (isShop) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-3 text-xs whitespace-pre-wrap text-white">
            {message.message}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-(--text-muted)">
            <span title={relativeTime(message.createdAt)}>{time}</span>
            <CheckCheck className="size-3 text-primary" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
        PZ
      </div>
      <div className="max-w-[75%]">
        <div className="rounded-2xl rounded-tl-sm bg-(--bg-surface) px-4 py-3 text-xs whitespace-pre-wrap text-(--text-primary) shadow-sm">
          {message.message}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[10px] text-(--text-muted)">
          <Clock className="size-3" />
          <span title={relativeTime(message.createdAt)}>{time}</span>
          <span>· {message.sender.name}</span>
        </div>
      </div>
    </div>
  )
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

const MAX = 2000

function NewTicketModal({
  onClose,
  onCreate,
  isPending,
  errorMessage,
  onDismissError,
}: {
  onClose: () => void
  onCreate: (input: CreateTicketInput) => void
  isPending: boolean
  errorMessage: string | null
  onDismissError: () => void
}) {
  const [category, setCategory] = useState<TicketCategory | null>(null)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")

  function handleSubmit() {
    if (!category || !description.trim() || isPending) return
    onCreate({
      category,
      title: subject.trim() || undefined,
      message: description.trim(),
    })
  }

  return (
    <DialogShell
      title="New support ticket"
      titleId="new-ticket-title"
      icon={<Plus className="size-4" />}
      panelClassName="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <div className="space-y-5 px-6 py-5">
        <div>
          <p className="mb-3 text-sm font-medium text-(--text-primary)">
            What is it about?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {TICKET_CATEGORIES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setCategory(value)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                  category === value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-(--border-light) text-(--text-muted) hover:border-primary/40 hover:text-(--text-primary)"
                }`}
              >
                <span className="text-sm">{CATEGORY_META[value].icon}</span>
                {CATEGORY_META[value].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="ticket-subject"
            className="mb-1.5 block text-sm font-medium text-(--text-primary)"
          >
            Subject
          </label>
          <input
            id="ticket-subject"
            type="text"
            maxLength={200}
            placeholder="Optional — defaults to Category request"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label
            htmlFor="ticket-description"
            className="mb-1.5 block text-sm font-medium text-(--text-primary)"
          >
            Describe the problem
          </label>
          <textarea
            id="ticket-description"
            rows={5}
            maxLength={MAX}
            placeholder="Include parcel IDs, dates and what you expected to happen."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2.5 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-right text-[10px] text-(--text-muted)">
            {description.length} / {MAX}
          </p>
        </div>

        {errorMessage && (
          <InlineNotice
            message={errorMessage}
            variant="error"
            ariaLive="assertive"
            dismissLabel="Dismiss error"
            onDismiss={onDismissError}
            className={noticeClassName("error")}
            dismissClassName="text-xs font-medium hover:underline"
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-(--border-light) bg-(--bg-app) px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="admin-template-button admin-template-button--secondary h-9 px-4 text-xs disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!category || !description.trim() || isPending}
          className="admin-template-button admin-template-button--primary flex h-9 items-center gap-1.5 px-5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="size-3.5" />
          Send ticket
        </button>
      </div>
    </DialogShell>
  )
}
