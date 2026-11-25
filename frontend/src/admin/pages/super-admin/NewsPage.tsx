import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import DataTable, { type TableColumn } from "react-data-table-component"
import {
  FileText,
  Megaphone,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Send,
  Trash2,
} from "lucide-react"
import {
  superNewsApi,
  superNewsQueryKeys,
  type NewsCategory,
  type NewsItemDto,
  type NewsStatus,
  type NewsWriteInput,
} from "../../api/newsApi"
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog"
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { LoadingState } from "../../components/common/LoadingState"
import { PortalActionMenu } from "../../components/common/PortalActionMenu"
import { StatusBadge } from "../../components/common/StatusBadge"
import { DashboardMetricCard } from "../../components/dashboard/DashboardMetricCard"
import { NewsFormModal } from "../../components/super-admin/NewsFormModal"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { getErrorMessage } from "../../lib/errors"
import { formatTimestamp } from "../../lib/formatTime"

type Notice = { tone: "success" | "error"; message: string }

const categoryTabs: { value: NewsCategory | "all"; label: string }[] = [
  { value: "all", label: "All categories" },
  { value: "charge", label: "Charge" },
  { value: "integration", label: "Integration" },
  { value: "notice", label: "Notice" },
  { value: "general", label: "General" },
]

const categoryLabels: Record<NewsCategory, string> = {
  charge: "Charge",
  integration: "Integration",
  notice: "Notice",
  general: "General",
}

export default function NewsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<NewsCategory | "all">("all")
  const [status, setStatus] = useState<NewsStatus | "all">("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<NewsItemDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<NewsItemDto | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const listParams = useMemo(
    () => ({
      q: debouncedSearch.trim() || undefined,
      category,
      status,
    }),
    [debouncedSearch, category, status]
  )

  const newsQuery = useQuery({
    queryKey: superNewsQueryKeys.list(listParams),
    queryFn: ({ signal }) => superNewsApi.list(listParams, signal),
    placeholderData: (previous) => previous,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: Partial<NewsWriteInput>
    }) => superNewsApi.update(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: superNewsQueryKeys.all })
      setNotice({
        tone: "success",
        message: `Announcement "${updated.title}" updated.`,
      })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to update the announcement."),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => superNewsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: superNewsQueryKeys.all })
      setNotice({ tone: "success", message: "Announcement deleted." })
      setDeleteTarget(null)
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to delete the announcement."),
      })
    },
  })

  const items = newsQuery.data?.items ?? []
  const counts = newsQuery.data?.counts ?? {
    total: 0,
    published: 0,
    draft: 0,
    pinned: 0,
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(item: NewsItemDto) {
    setEditing(item)
    setFormOpen(true)
  }

  function togglePin(item: NewsItemDto) {
    updateMutation.mutate({ id: item.id, input: { isPinned: !item.isPinned } })
  }

  function toggleStatus(item: NewsItemDto) {
    updateMutation.mutate({
      id: item.id,
      input: { status: item.status === "published" ? "draft" : "published" },
    })
  }

  const columns: TableColumn<NewsItemDto>[] = [
    {
      name: "ANNOUNCEMENT",
      minWidth: "300px",
      grow: 2,
      cell: (row) => (
        <div className="min-w-0 py-2">
          <p className="truncate text-sm font-semibold text-(--text-primary)">
            {row.title}
          </p>
          <p className="mt-0.5 line-clamp-2 text-xs text-(--text-muted)">
            {row.description || "No description"}
          </p>
        </div>
      ),
    },
    {
      name: "CATEGORY",
      width: "130px",
      cell: (row) => (
        <StatusBadge
          variant={row.category === "charge" ? "warning" : "info"}
          label={categoryLabels[row.category]}
        />
      ),
    },
    {
      name: "STATUS",
      width: "120px",
      cell: (row) => (
        <StatusBadge
          variant={row.status === "published" ? "success" : "inactive"}
          label={row.status === "published" ? "Published" : "Draft"}
        />
      ),
    },
    {
      name: "PINNED",
      width: "100px",
      cell: (row) =>
        row.isPinned ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-(--primary-soft) px-2 py-0.5 text-xs font-medium text-(--primary)">
            <Pin className="size-3" /> Pinned
          </span>
        ) : (
          <span className="text-xs text-(--text-muted)">—</span>
        ),
    },
    {
      name: "PUBLISHED",
      width: "140px",
      cell: (row) => (
        <span className="text-xs text-(--text-muted) tabular-nums">
          {formatTimestamp(row.publishedAt)}
        </span>
      ),
    },
    {
      name: "ACTIONS",
      width: "80px",
      right: true,
      cell: (row) => (
        <PortalActionMenu
          label={`Actions for ${row.title}`}
          trigger={<MoreVertical className="size-4" />}
          triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
          menuClassName="w-48"
        >
          {(closeMenu) => (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  openEdit(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
              >
                <Pencil className="size-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  togglePin(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
              >
                {row.isPinned ? (
                  <>
                    <PinOff className="size-3.5" /> Unpin
                  </>
                ) : (
                  <>
                    <Pin className="size-3.5" /> Pin
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  toggleStatus(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
              >
                <Send className="size-3.5" />
                {row.status === "published" ? "Move to Draft" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setDeleteTarget(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--status-cancelled-text) hover:bg-(--status-cancelled-bg)"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </>
          )}
        </PortalActionMenu>
      ),
    },
  ]

  if (newsQuery.isLoading) {
    return (
      <LoadingState
        className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)"
        ariaLabel="Loading announcements"
      >
        Loading announcements…
      </LoadingState>
    )
  }

  if (newsQuery.error) {
    return (
      <ErrorState
        className="m-6 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
        messageClassName="mb-3 text-sm text-(--text-muted)"
        buttonClassName="h-8 rounded-md bg-(--primary) px-3 text-sm font-medium text-white"
        message={getErrorMessage(newsQuery.error, "Could not load news posts.")}
        onRetry={() => void newsQuery.refetch()}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">
            News & Updates
          </h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Publish platform announcements visible to every shop.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
        >
          <Plus className="size-4" />
          New Announcement
        </button>
      </header>

      <section
        className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="News summary"
      >
        <DashboardMetricCard
          label="Total"
          value={counts.total}
          subText="All announcements"
          icon={<Megaphone className="size-4" />}
        />
        <DashboardMetricCard
          label="Published"
          value={counts.published}
          subText="Visible to shops"
          variant="success"
          icon={<Send className="size-4" />}
        />
        <DashboardMetricCard
          label="Drafts"
          value={counts.draft}
          subText="Not yet visible"
          variant="warning"
          icon={<FileText className="size-4" />}
        />
        <DashboardMetricCard
          label="Pinned"
          value={counts.pinned}
          subText="Shown first in the feed"
          icon={<Pin className="size-4" />}
        />
      </section>

      {notice && (
        <InlineNotice
          message={notice.message}
          variant={notice.tone}
          ariaLive={notice.tone === "error" ? "assertive" : "polite"}
          dismissLabel="Dismiss notification"
          onDismiss={() => setNotice(null)}
          className={
            notice.tone === "error"
              ? "flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-4 py-2.5 text-sm text-(--status-cancelled-text)"
              : "flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
          }
          dismissClassName="text-xs font-medium hover:underline"
        />
      )}

      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <div className="flex flex-col gap-2 border-b border-(--border-light) p-3 sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements..."
            className="h-8 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-(--primary) sm:max-w-64"
          />
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as NewsCategory | "all")
            }
            aria-label="Filter by category"
            className="h-8 rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
          >
            {categoryTabs.map((tab) => (
              <option key={tab.value} value={tab.value}>
                {tab.label}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as NewsStatus | "all")
            }
            aria-label="Filter by status"
            className="h-8 rounded-md border border-(--border-light) bg-(--bg-app) px-2 text-xs text-(--text-primary) outline-none focus:border-(--primary)"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <DataTable
          columns={columns}
          data={items}
          customStyles={adminDataTableStyles}
          pagination
          paginationPerPage={10}
          paginationRowsPerPageOptions={[10, 20, 50]}
          noDataComponent={
            <p className="py-10 text-center text-sm text-(--text-muted)">
              No announcements found.
            </p>
          }
        />
      </section>

      <NewsFormModal
        open={formOpen}
        news={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(message) => setNotice({ tone: "success", message })}
      />

      <ConfirmationDialog
        open={deleteTarget !== null}
        title="Delete announcement?"
        description={
          <>
            Delete <strong>{deleteTarget?.title}</strong>? Shop users will no
            longer see it. This action cannot be undone.
          </>
        }
        variant="danger"
        icon={Trash2}
        confirmLabel="Delete announcement"
        isPending={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError
            ? getErrorMessage(deleteMutation.error, "Failed to delete post.")
            : null
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
      />
    </div>
  )
}
