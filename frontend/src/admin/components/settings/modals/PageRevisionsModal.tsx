import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Clock, History, RotateCcw, X } from "lucide-react"
import { ConfirmationDialog } from "../../common/ConfirmationDialog"
import { ErrorState } from "../../common/ErrorState"
import { LoadingState } from "../../common/LoadingState"
import { useEscapeKey } from "../../../hooks/useEscapeKey"
import { formatTimestamp } from "../../../lib/formatTime"
import { pagesApi, pageQueryKeys } from "../../../api/pagesApi"
import type { PageDetail, PageRevisionItem } from "../../../types/pages"

function previewSnippet(html: string): string {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > 140 ? `${text.slice(0, 140)}…` : text || "(empty content)"
}

/* ================================================================
   PageRevisionsModal — browse and restore the last 30 snapshots.
   ================================================================ */

export function PageRevisionsModal({
  open,
  pageId,
  pageTitle,
  hasUnsavedChanges = false,
  onClose,
  onRestored,
}: {
  open: boolean
  pageId: number | null
  pageTitle: string
  hasUnsavedChanges?: boolean
  onClose: () => void
  onRestored?: (page: PageDetail) => void
}) {
  const queryClient = useQueryClient()
  const [pendingRevision, setPendingRevision] =
    useState<PageRevisionItem | null>(null)

  const revisionsQuery = useQuery({
    queryKey: pageQueryKeys.revisions(pageId ?? 0),
    queryFn: ({ signal }) => {
      if (pageId === null) throw new Error("No page selected")
      return pagesApi.revisions(pageId, signal)
    },
    enabled: open && pageId !== null,
  })

  const restoreMutation = useMutation({
    mutationFn: (revisionId: number) => {
      if (pageId === null) throw new Error("No page selected")
      return pagesApi.restoreRevision(pageId, revisionId)
    },
    onSuccess: (page) => {
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all })
      setPendingRevision(null)
      onRestored?.(page)
      onClose()
    },
  })

  useEffect(() => {
    if (!open) return
    setPendingRevision(null)
  }, [open, pageId])

  useEscapeKey(onClose, open && pendingRevision === null && !restoreMutation.isPending)

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  if (!open || pageId === null) return null

  const revisions = revisionsQuery.data?.items ?? []

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="revisions-modal-title"
        onMouseDown={() => {
          if (pendingRevision === null && !restoreMutation.isPending) onClose()
        }}
        className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 duration-150 fade-in"
      >
        <div
          onMouseDown={(event) => event.stopPropagation()}
          className="flex max-h-[85vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl duration-150 zoom-in-95 fade-in"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
                <History className="size-4" />
              </span>
              <div className="min-w-0">
                <h2
                  id="revisions-modal-title"
                  className="text-base font-semibold text-(--text-primary)"
                >
                  Revision history
                </h2>
                <p className="truncate text-xs text-(--text-muted)">
                  {pageTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={restoreMutation.isPending}
              aria-label="Close"
              className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {revisionsQuery.isPending ? (
              <LoadingState
                className="px-4 py-10 text-center text-xs text-(--text-muted)"
                ariaLabel="Loading revisions"
              >
                Loading revisions…
              </LoadingState>
            ) : revisionsQuery.isError ? (
              <ErrorState
                message={
                  revisionsQuery.error instanceof Error
                    ? revisionsQuery.error.message
                    : "Could not load revisions"
                }
                onRetry={() => void revisionsQuery.refetch()}
                className="px-4 py-10 text-center text-xs text-(--text-muted)"
                buttonClassName="mt-2 rounded-md border border-(--border-light) px-3 py-1.5 text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
                role="alert"
              />
            ) : revisions.length === 0 ? (
              <p className="px-4 py-10 text-center text-xs text-(--text-muted)">
                No revisions found for this page.
              </p>
            ) : (
              <ul className="space-y-2">
                {revisions.map((revision, index) => (
                  <li
                    key={revision.id}
                    className="rounded-md border border-(--border-light) bg-(--bg-surface) p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-(--text-primary)">
                          <Clock className="size-3.5 shrink-0 text-(--text-muted)" />
                          {formatTimestamp(revision.editedAt)}
                          {index === 0 && (
                            <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
                              Latest
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm font-medium text-(--text-primary)">
                          {revision.title}
                        </p>
                        <p className="mt-0.5 text-xs text-(--text-muted)">
                          Edited by {revision.editedBy}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingRevision(revision)}
                        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-2.5 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                      >
                        <RotateCcw className="size-3.5" />
                        Restore
                      </button>
                    </div>
                    <p className="mt-2 rounded bg-(--bg-table-header) px-2 py-1.5 text-xs leading-relaxed text-(--text-muted) break-words">
                      {previewSnippet(revision.contentHtml)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={pendingRevision !== null}
        title="Restore this revision?"
        description={
          <>
            The title and content of <strong>{pageTitle}</strong> will be
            overwritten with the snapshot from{" "}
            {pendingRevision
              ? formatTimestamp(pendingRevision.editedAt)
              : "this revision"}
            .
            {hasUnsavedChanges
              ? " Your unsaved editor changes will be lost."
              : " This action replaces the current content."}
          </>
        }
        variant="warning"
        icon={RotateCcw}
        confirmLabel="Restore revision"
        isPending={restoreMutation.isPending}
        errorMessage={
          restoreMutation.isError && restoreMutation.error instanceof Error
            ? restoreMutation.error.message
            : null
        }
        onCancel={() => {
          if (restoreMutation.isPending) return
          setPendingRevision(null)
          restoreMutation.reset()
        }}
        onConfirm={() => {
          if (pendingRevision) restoreMutation.mutate(pendingRevision.id)
        }}
      />
    </>
  )
}
