import { useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CheckCheck,
  Clock,
  Image,
  MessageCircle,
  Paperclip,
  RotateCcw,
  Search,
  Send,
} from "lucide-react"
import {
  superSupportApi,
  superSupportQueryKeys,
  type SupportMessageDto,
  type TicketStatus,
} from "../../api/supportApi"
import { superAdminApi } from "../../api/superAdminApi"
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { LoadingState } from "../../components/common/LoadingState"
import { StatusBadge } from "../../components/common/StatusBadge"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { getErrorMessage } from "../../lib/errors"
import { formatTimestamp, relativeTime } from "../../lib/formatTime"

type Notice = { tone: "success" | "error"; message: string }
type FilterTab = TicketStatus | "all"

const CATEGORY_LABELS: Record<string, string> = {
  pickup: "Pickup",
  delivery: "Delivery",
  payment: "Payment",
  billing: "Billing & charges",
  service: "Service",
  other: "Other",
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
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<FilterTab>("all")
  const [shopId, setShopId] = useState<number | "all">("all")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const shopsQuery = useQuery({
    queryKey: ["admin", "super", "shops", "list"],
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
  })

  const listParams = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      status: statusFilter,
      shopId: shopId === "all" ? undefined : shopId,
    }),
    [debouncedSearch, statusFilter, shopId]
  )

  const listQuery = useQuery({
    queryKey: superSupportQueryKeys.list(listParams),
    queryFn: ({ signal }) => superSupportApi.list(listParams, signal),
    placeholderData: (previous) => previous,
  })

  const items = listQuery.data?.items ?? []
  const counts = listQuery.data?.counts ?? {
    total: 0,
    open: 0,
    answered: 0,
    closed: 0,
  }

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
    queryKey: superSupportQueryKeys.detail(selectedId ?? 0),
    queryFn: ({ signal }) => {
      if (selectedId === null) throw new Error("Missing ticket id")
      return superSupportApi.get(selectedId, signal)
    },
    enabled: selectedId !== null,
  })
  const ticket = detailQuery.data ?? null

  const replyMutation = useMutation({
    mutationFn: ({
      id,
      message,
    }: {
      id: number
      message: string
    }) => superSupportApi.reply(id, message),
    onSuccess: () => {
      setReplyText("")
      void queryClient.invalidateQueries({ queryKey: superSupportQueryKeys.all })
      setNotice({ tone: "success", message: "Reply sent to the shop." })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to send the reply."),
      })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number
      status: TicketStatus
    }) => superSupportApi.updateStatus(id, status),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: superSupportQueryKeys.all })
      setNotice({
        tone: "success",
        message:
          updated.status === "closed" ? "Ticket closed." : "Ticket reopened.",
      })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to update the ticket."),
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

  function tabCount(tab: FilterTab) {
    if (tab === "all") return counts.total
    return counts[tab]
  }

  return (
    <div className="admin-dashboard-content flex h-[calc(100dvh-56px-41px)] flex-col overflow-hidden">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-3 border-b border-(--border-light) bg-(--bg-surface) px-6 py-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-(--text-primary)">
            Support Inbox
          </h1>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Conversations with shops across the platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={shopId}
            onChange={(event) =>
              setShopId(
                event.target.value === "all"
                  ? "all"
                  : Number(event.target.value)
              )
            }
            aria-label="Filter by shop"
            className="h-8 rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-xs text-(--text-primary) outline-none focus:border-primary"
          >
            <option value="all">All Shops</option>
            {(shopsQuery.data ?? []).map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
          <span className="rounded-full bg-(--bg-app) px-2.5 py-1 text-[11px] font-medium text-(--text-muted) tabular-nums">
            Total {counts.total}
          </span>
          <span className="rounded-full bg-(--status-pending-bg) px-2.5 py-1 text-[11px] font-medium text-(--status-pending-text) tabular-nums">
            Open {counts.open}
          </span>
          <span className="rounded-full bg-(--status-delivered-bg) px-2.5 py-1 text-[11px] font-medium text-(--status-delivered-text) tabular-nums">
            Answered {counts.answered}
          </span>
          <span className="rounded-full bg-(--bg-app) px-2.5 py-1 text-[11px] font-medium text-(--text-muted) tabular-nums">
            Closed {counts.closed}
          </span>
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
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.value
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
                ariaLabel="Loading support inbox"
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
                <p className="text-sm font-medium text-(--text-primary)">
                  No tickets found
                </p>
                <p className="text-xs text-(--text-muted)">
                  Try a different shop, status or search term.
                </p>
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
                      className="capitalize"
                    />
                  </div>
                  {item.shop && (
                    <p className="mt-1 truncate text-[11px] text-(--text-muted)">
                      🏪 {item.shop.name}
                    </p>
                  )}
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
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-(--border-light) bg-(--bg-surface) px-6 py-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-primary">
                      #{ticket.ticketNumber}
                    </span>
                    <h2 className="text-sm font-semibold text-(--text-primary)">
                      {ticket.title}
                    </h2>
                    <StatusBadge
                      variant={STATUS_VARIANT[ticket.status]}
                      label={ticket.status}
                      className="capitalize"
                    />
                  </div>
                  <p className="mt-1 text-xs text-(--text-muted)">
                    {ticket.shop && (
                      <span className="mr-2 font-medium text-(--text-primary)">
                        🏪 {ticket.shop.name}
                      </span>
                    )}
                    Started {formatTimestamp(ticket.createdAt)} · Category:{" "}
                    {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: ticket.id,
                      status: ticket.status === "closed" ? "open" : "closed",
                    })
                  }
                  className="admin-template-button admin-template-button--secondary h-8 shrink-0 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ticket.status === "closed" ? (
                    <>
                      <RotateCcw className="size-3.5" />
                      Reopen Ticket
                    </>
                  ) : (
                    "Mark Closed"
                  )}
                </button>
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
                  disabled={
                    ticket.status === "closed" || replyMutation.isPending
                  }
                  className="w-full resize-none rounded-md border border-(--border-light) bg-(--bg-app) px-3 py-2 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
                {ticket.status === "closed" && (
                  <p className="mt-1 text-[11px] text-(--text-muted)">
                    Reopen ticket to reply
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
    </div>
  )
}

function ChatBubble({ message }: { message: SupportMessageDto }) {
  const isSupport = message.senderType === "support"
  const time = formatTimestamp(message.createdAt)

  if (isSupport) {
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
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-[10px] font-bold text-primary">
        {message.sender.name.slice(0, 1).toUpperCase()}
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
