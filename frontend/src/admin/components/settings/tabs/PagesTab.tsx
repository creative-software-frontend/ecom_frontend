import { useLayoutEffect, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Copy,
  Eye,
  Save,
  Lock,
  Cloud,
  Search,
  History,
  Plus,
  Trash2,
} from "lucide-react"
import { SettingsLayout } from "../SettingsLayout"
import { FieldError, FormSegmentedControl } from "../SettingsField"
import { PageListItem } from "../PageListItem"
import { RichTextToolbar, type ToolbarCommand } from "../RichTextToolbar"
import { CreatePageModal } from "../modals/CreatePageModal"
import { PageRevisionsModal } from "../modals/PageRevisionsModal"
import { ConfirmationDialog } from "../../common/ConfirmationDialog"
import { EmptyState } from "../../common/EmptyState"
import { ErrorState } from "../../common/ErrorState"
import { InlineNotice } from "../../common/InlineNotice"
import { LoadingState } from "../../common/LoadingState"
import { ApiError } from "../../../api/client"
import { pagesApi, pageQueryKeys } from "../../../api/pagesApi"
import { formatDate, relativeTime } from "../../../lib/formatTime"
import { pageSchema, type PageFormValues } from "../../../schemas/pageSchema"
import type { UpdatePageInput } from "../../../types/pages"

type Notice = { tone: "success" | "error"; message: string }

/* ================================================================
   Helpers
   ================================================================ */

function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text ? text.split(" ").length : 0
}

function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").length
}

/* ================================================================
   PagesTab — shop-scoped CMS pages, wired to the API.
   ================================================================ */

export default function PagesTab() {
  const queryClient = useQueryClient()
  const [selectedPageId, setSelectedPageId] = useState<number | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [pendingSwitchId, setPendingSwitchId] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const pagesQuery = useQuery({
    queryKey: pageQueryKeys.list(),
    queryFn: ({ signal }) => pagesApi.list(signal),
  })
  const pages = pagesQuery.data?.items ?? []
  const activePageId =
    selectedPageId !== null && pages.some((page) => page.id === selectedPageId)
      ? selectedPageId
      : (pages[0]?.id ?? null)

  const detailQuery = useQuery({
    queryKey: pageQueryKeys.detail(activePageId ?? 0),
    queryFn: ({ signal }) => {
      if (activePageId === null) throw new Error("No page selected")
      return pagesApi.get(activePageId, signal)
    },
    enabled: activePageId !== null,
  })
  const selectedPage = detailQuery.data ?? null

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty: formDirty },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      title: "",
      slug: "",
      language: "EN",
      status: "draft",
    },
  })

  // Rich text lives in local state because contentEditable cannot be
  // registered cleanly with react-hook-form.
  const [content, setContent] = useState("")
  const [originalContent, setOriginalContent] = useState("")
  const editorRef = useRef<HTMLDivElement>(null)

  // Seed the editor whenever a different page (or a freshly saved version)
  // arrives. Keying on updatedAt avoids clobbering in-progress edits on a
  // background refetch.
  useLayoutEffect(() => {
    if (!selectedPage) return
    reset({
      title: selectedPage.title,
      slug: selectedPage.slug,
      language: selectedPage.language,
      status: selectedPage.status,
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(selectedPage.contentHtml)
    setOriginalContent(selectedPage.contentHtml)
    if (editorRef.current) {
      editorRef.current.innerHTML = selectedPage.contentHtml
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPage?.id, selectedPage?.updatedAt, reset])

  const contentDirty = content !== originalContent
  const isDirty = formDirty || contentDirty
  const wordCount = countWords(content)
  const charCount = countChars(content)

  const saveMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdatePageInput }) =>
      pagesApi.update(id, input),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all })
      setNotice({ tone: "success", message: `Page "${updated.title}" saved.` })
    },
    onError: (error) => {
      const fieldMessage =
        error instanceof ApiError ? error.fieldErrors?.slug : undefined
      setNotice({
        tone: "error",
        message:
          fieldMessage ??
          (error instanceof Error ? error.message : "Could not save the page"),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pagesApi.remove(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: pageQueryKeys.all })
      if (selectedPageId === id) setSelectedPageId(null)
      setDeleteOpen(false)
      reset({
        title: "",
        slug: "",
        language: "EN",
        status: "draft",
      })
      setContent("")
      setOriginalContent("")
      setNotice({ tone: "success", message: "Page deleted." })
    },
    onError: (error) => {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not delete the page",
      })
    },
  })

  function handleCommand(command: ToolbarCommand, value?: string) {
    editorRef.current?.focus()
    const normalized = command === "formatBlock" && value ? `<${value}>` : value
    // execCommand is deprecated but still supported by target browsers.
    document.execCommand(command, false, normalized)
    if (editorRef.current) setContent(editorRef.current.innerHTML)
  }

  function onSubmit(data: PageFormValues) {
    if (activePageId === null) return
    setNotice(null)
    saveMutation.mutate({
      id: activePageId,
      input: {
        title: data.title.trim(),
        slug: data.slug,
        contentHtml: content,
        status: data.status,
        language: data.language,
      },
    })
  }

  function handleDiscard() {
    if (!selectedPage) return
    reset({
      title: selectedPage.title,
      slug: selectedPage.slug,
      language: selectedPage.language,
      status: selectedPage.status,
    })
    setContent(originalContent)
    if (editorRef.current) editorRef.current.innerHTML = originalContent
  }

  function handleSelectPage(pageId: number) {
    if (pageId === activePageId) return
    if (isDirty) {
      setPendingSwitchId(pageId)
      return
    }
    setSelectedPageId(pageId)
  }

  async function handleCopyLink() {
    if (!selectedPage) return
    const link = `${window.location.origin}/pages/${selectedPage.slug}`
    if (!navigator.clipboard) {
      setNotice({ tone: "error", message: "Clipboard access is unavailable." })
      return
    }
    try {
      await navigator.clipboard.writeText(link)
      setNotice({ tone: "success", message: `Public link copied: ${link}` })
    } catch {
      setNotice({ tone: "error", message: "Could not copy the public link." })
    }
  }

  function handlePreview() {
    setNotice({
      tone: "success",
      message:
        "Public page preview is unavailable until the storefront page route is connected.",
    })
  }

  return (
    <SettingsLayout
      activeTab="pages"
      badges={{ pages: pages.length }}
      isDirty={isDirty}
      isSaving={saveMutation.isPending}
      onDiscard={handleDiscard}
      onSave={handleSubmit(onSubmit)}
      saveBarDescription={
        selectedPage
          ? `Changes made to "${selectedPage.title}" are applied when you save.`
          : undefined
      }
    >
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

      {pagesQuery.isPending ? (
        <LoadingState
          className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
          ariaLabel="Loading pages"
        >
          Loading pages…
        </LoadingState>
      ) : pagesQuery.isError ? (
        <ErrorState
          message={
            pagesQuery.error instanceof Error
              ? pagesQuery.error.message
              : "Could not load pages"
          }
          onRetry={() => void pagesQuery.refetch()}
          className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
          buttonClassName="mt-2 rounded-md border border-(--border-light) px-3 py-1.5 text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
          role="alert"
        />
      ) : pages.length === 0 ? (
        <EmptyState
          title="No pages yet"
          description="Create an about, privacy, delivery or returns page for your storefront."
          className="rounded-md border-2 border-dashed border-(--border-light) bg-(--bg-surface) px-6 py-12 text-center"
          titleClassName="text-sm font-semibold text-(--text-primary)"
          descriptionClassName="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-(--text-muted)"
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
            >
              <Plus className="size-3.5" />
              Add custom page
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
          {/* ============ LEFT: page list ============ */}
          <aside className="flex flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
            <div className="flex items-center justify-between gap-2 border-b border-(--border-light) px-3 py-2.5">
              <span className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
                Store content
              </span>
              <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-xs font-medium text-(--text-muted) tabular-nums">
                {pages.length} items
              </span>
            </div>
            <ul className="flex-1">
              {pages.map((page) => (
                <li key={page.id}>
                  <PageListItem
                    page={page}
                    isActive={page.id === activePageId}
                    onClick={() => handleSelectPage(page.id)}
                  />
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center justify-center gap-1.5 border-t border-(--border-light) px-3 py-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
            >
              <Plus className="size-3.5" />
              Add custom page
            </button>
          </aside>

          {/* ============ RIGHT: editor ============ */}
          {detailQuery.isPending ? (
            <LoadingState
              className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
              ariaLabel="Loading page"
            >
              Loading page…
            </LoadingState>
          ) : detailQuery.isError ? (
            <ErrorState
              message={
                detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : "Could not load this page"
              }
              onRetry={() => void detailQuery.refetch()}
              className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
              buttonClassName="mt-2 rounded-md border border-(--border-light) px-3 py-1.5 text-xs text-(--text-primary) hover:bg-(--bg-surface-hover)"
              role="alert"
            />
          ) : !selectedPage ? (
            <EmptyState
              title="Select a page"
              description="Choose a page from the list to start editing."
              className="rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-10 text-center text-xs text-(--text-muted)"
            />
          ) : (
            <div className="space-y-4">
              {/* Header row */}
              <div className="rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-(--text-primary)">
                        Edit Page: {selectedPage.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${
                          selectedPage.status === "published"
                            ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
                            : "bg-(--bg-table-header) text-(--text-muted)"
                        }`}
                      >
                        {selectedPage.status === "published" ? "Live" : "Draft"}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
                      <span>Public Link:</span>
                      <code className="rounded bg-(--bg-table-header) px-1.5 py-0.5 font-mono">
                        /pages/{selectedPage.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => void handleCopyLink()}
                        className="rounded p-0.5 transition-colors hover:bg-(--bg-table-header)"
                        aria-label="Copy public link"
                        title="Copy public link"
                      >
                        <Copy className="size-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePreview}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                    >
                      <Eye className="size-3.5" /> Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteOpen(true)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--status-cancelled-text) transition-colors hover:bg-(--status-cancelled-bg)"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      disabled={saveMutation.isPending}
                      className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
                    >
                      <Save className="size-3.5" />
                      {saveMutation.isPending ? "Saving..." : "Save page"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor card */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-3 rounded-md border border-(--border-light) bg-(--bg-surface) p-4"
              >
                {/* Status + language are part of the same save operation */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
                      Status
                    </label>
                    <Controller
                      control={control}
                      name="status"
                      render={({ field }) => (
                        <FormSegmentedControl
                          aria-label="Page status"
                          options={[
                            { value: "draft", label: "Draft" },
                            { value: "published", label: "Published" },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
                      Language
                    </label>
                    <Controller
                      control={control}
                      name="language"
                      render={({ field }) => (
                        <FormSegmentedControl
                          aria-label="Page language"
                          options={[
                            { value: "EN", label: "English" },
                            { value: "BN", label: "বাংলা" },
                            { value: "EN / BN", label: "Both" },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Title + slug */}
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <label
                      htmlFor="page-title"
                      className="mb-1.5 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase"
                    >
                      Page title
                    </label>
                    <input
                      id="page-title"
                      type="text"
                      maxLength={150}
                      className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      {...register("title")}
                    />
                    {errors.title && (
                      <FieldError>{errors.title.message}</FieldError>
                    )}
                  </div>
                  <div className="md:w-64">
                    <label
                      htmlFor="page-slug"
                      className="mb-1.5 block text-xs font-semibold tracking-wider text-(--text-muted) uppercase"
                    >
                      URL slug
                    </label>
                    <div className="flex h-9 items-center rounded-md border border-(--border-light) bg-(--bg-surface-hover) px-3">
                      <span className="text-sm text-(--text-muted)">/</span>
                      <input
                        id="page-slug"
                        type="text"
                        readOnly
                        // Slug is locked because changing it breaks inbound links.
                        className="h-full min-w-0 flex-1 bg-transparent text-sm text-(--text-primary) outline-none"
                        {...register("slug")}
                      />
                      <Lock
                        className="ml-2 size-3.5 shrink-0 text-(--text-muted)"
                        aria-label="Slug is read-only"
                      />
                    </div>
                  </div>
                </div>

                <RichTextToolbar onCommand={handleCommand} />

                {/* key forces remount on page switch so innerHTML resets cleanly */}
                <div
                  key={selectedPage.id}
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Page content"
                  onInput={(event) => setContent(event.currentTarget.innerHTML)}
                  className="admin-rte min-h-80 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-3 text-sm leading-relaxed text-(--text-primary) outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                />

                {/* Editor footer meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-light) pt-2 text-xs text-(--text-muted)">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Words:{" "}
                      <strong className="text-(--text-primary) tabular-nums">
                        {wordCount}
                      </strong>
                    </span>
                    <span>
                      Characters:{" "}
                      <strong className="text-(--text-primary) tabular-nums">
                        {charCount}
                      </strong>
                    </span>
                    <span>
                      Last edited:{" "}
                      <strong className="text-(--text-primary)">
                        {relativeTime(selectedPage.updatedAt)}
                      </strong>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1">
                    <Cloud className="size-3" />
                    Saved to this shop
                  </span>
                </div>
                <button type="submit" className="sr-only">
                  Save page
                </button>
              </form>

              {/* Bottom cards */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-md border border-(--border-light) bg-(--bg-surface) p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--bg-surface-hover) text-(--text-muted)">
                      <Search className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-(--text-primary)">
                        Search Engine Listing
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
                        Clean slugs help this page appear in local search
                        results. Slugs are fixed once the page is created.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border border-(--border-light) bg-(--bg-surface) p-3">
                  <div className="flex items-start gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--bg-surface-hover) text-(--text-muted)">
                      <History className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-xs font-semibold text-(--text-primary)">
                        Revision History
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
                        Last updated by {selectedPage.lastEditedBy} on{" "}
                        {formatDate(selectedPage.updatedAt)}.{" "}
                        {selectedPage.revisionCount} saved revision(s).
                      </p>
                      <button
                        type="button"
                        onClick={() => setRevisionsOpen(true)}
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        Restore Previous Version
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <CreatePageModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={(page) => {
          setSelectedPageId(page.id)
          setNotice({
            tone: "success",
            message: `Page "${page.title}" created. Add its content below.`,
          })
        }}
      />

      <PageRevisionsModal
        open={revisionsOpen}
        pageId={activePageId}
        pageTitle={selectedPage?.title ?? ""}
        hasUnsavedChanges={isDirty}
        onClose={() => setRevisionsOpen(false)}
        onRestored={() => {
          setNotice({
            tone: "success",
            message: "Revision restored. Review the page content below.",
          })
        }}
      />

      {/* Unsafe page switch confirmation */}
      <ConfirmationDialog
        open={pendingSwitchId !== null}
        title="Discard unsaved changes?"
        description={
          selectedPage
            ? `Changes to "${selectedPage.title}" have not been saved. Switching pages will discard them.`
            : "Your unsaved changes will be discarded."
        }
        variant="warning"
        icon={Trash2}
        confirmLabel="Discard changes"
        onCancel={() => setPendingSwitchId(null)}
        onConfirm={() => {
          if (pendingSwitchId !== null) setSelectedPageId(pendingSwitchId)
          setPendingSwitchId(null)
        }}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteOpen}
        title="Delete page?"
        description={
          selectedPage ? (
            <>
              Delete <strong>{selectedPage.title}</strong> and all of its
              revisions? This action cannot be undone.
            </>
          ) : null
        }
        variant="danger"
        icon={Trash2}
        confirmLabel="Delete page"
        isPending={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError && deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : null
        }
        onCancel={() => {
          if (deleteMutation.isPending) return
          setDeleteOpen(false)
          deleteMutation.reset()
        }}
        onConfirm={() => {
          if (activePageId !== null) deleteMutation.mutate(activePageId)
        }}
      />
    </SettingsLayout>
  )
}
