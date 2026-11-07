import { useLayoutEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Copy,
  Eye,
  Save,
  Lock,
  Cloud,
  Search,
  History,
  Plus,
} from "lucide-react"
import { SettingsLayout } from "../SettingsLayout"
import { FieldError } from "../SettingsField"
import { PageListItem } from "../PageListItem"
import { RichTextToolbar, type ToolbarCommand } from "../RichTextToolbar"
import { pageSchema, type PageFormValues } from "../../../schemas/pageSchema"
import type { PageDetail } from "@/admin/types/pages"

/* ================================================================
   Mock pages — replace with API later.
   Content HTML is what a rich text editor would produce.
   ================================================================ */

const mockPages: PageDetail[] = [
  {
    id: "p1",
    title: "Privacy policy",
    slug: "privacy-policy",
    status: "published",
    edited_at: "Edited 3d ago",
    language: "EN / BN",
    last_edited_by: "Abdur Razzaq",
    last_edited_at: "Oct 24, 2024 at 14:32 BST",
    revision_count: 4,
    content_html: `<h2>Privacy &amp; Data Protection Policy</h2>
<p>Power Zenox respects your privacy. All customer data collected during checkout is stored securely using industry-standard encrypted storage. We strictly adhere to fair-use customer protection practices across our logistics networks in Bangladesh.</p>
<blockquote>
<p><strong>তথ্য সংগ্রহ ও ব্যবহার (Data Collection &amp; Usage)</strong></p>
<p>পাওয়ার জেনক্স (Power Zenox) থেকে পণ্য ক্রয়ের সময় গ্রাহকের নাম, ডেলিভারির ঠিকানা এবং সচল মোবাইল নম্বর সংগ্রহ করা হয়। এটি শুধুমাত্র কুরিয়ার ডেলিভারি ও প্যাকেজিং কাজে ব্যবহার হয়। তৃতীয় পক্ষের কোনো প্রচারণার কাজে আপনার নাম বা ঠিকানা হস্তান্তর করা হয় না।</p>
</blockquote>
<h3>Payment &amp; Verification Protocol</h3>
<p>For Cash on Delivery (COD) dispatches within Dhaka and nationwide through Steadfast / RedX, order confirmation may require SMS or voice authentication to reduce return rates.</p>`,
  },
  {
    id: "p2",
    title: "Terms and conditions",
    slug: "terms-and-conditions",
    status: "published",
    edited_at: "Edited 12d ago",
    language: "EN",
    last_edited_by: "Abdur Razzaq",
    last_edited_at: "Oct 15, 2024 at 10:00 BST",
    revision_count: 2,
    content_html: `<h2>Terms &amp; Conditions</h2><p>By placing an order you agree to these terms.</p>`,
  },
  {
    id: "p3",
    title: "Return policy",
    slug: "return-policy",
    status: "published",
    edited_at: "Edited 1mo ago",
    language: "EN / BN",
    last_edited_by: "Abdur Razzaq",
    last_edited_at: "Sep 20, 2024 at 16:00 BST",
    revision_count: 1,
    content_html: `<h2>Return Policy</h2><p>Unopened items may be returned within 7 days of delivery.</p>`,
  },
  {
    id: "p4",
    title: "Delivery policy",
    slug: "delivery-policy",
    status: "published",
    edited_at: "Edited 2mo ago",
    language: "EN / BN",
    last_edited_by: "Abdur Razzaq",
    last_edited_at: "Aug 28, 2024 at 11:30 BST",
    revision_count: 1,
    content_html: `<h2>Delivery Policy</h2><p>Inside Dhaka: 1 day. Outside Dhaka: 2–3 days.</p>`,
  },
  {
    id: "p5",
    title: "About us",
    slug: "about-us",
    status: "draft",
    edited_at: "Edited yesterday",
    language: "EN",
    last_edited_by: "Abdur Razzaq",
    last_edited_at: "Oct 30, 2024 at 20:00 BST",
    revision_count: 3,
    content_html: `<h2>About Power Zenox</h2><p>We are a Dhaka-based herbal wellness company.</p>`,
  },
]

/* ================================================================
   Helpers
   ================================================================ */

// Strip HTML tags and count whitespace-separated words.
function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!text) return 0
  return text.split(" ").length
}

// Count non-whitespace characters after stripping tags — matches the design.
function countChars(html: string): number {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, "").length
}

/* ================================================================
   PagesTab
   ================================================================ */

export default function PagesTab() {
  const [pages] = useState<PageDetail[]>(mockPages)
  const [selectedPageId, setSelectedPageId] = useState(pages[0].id)
  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? pages[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty: formDirty, isSubmitting },
  } = useForm<PageFormValues>({
    resolver: zodResolver(pageSchema),
    defaultValues: { title: selectedPage.title, slug: selectedPage.slug },
  })

  // Rich text content is kept in local state — RHF cannot track contentEditable.
  const [content, setContent] = useState(selectedPage.content_html)
  const [originalContent, setOriginalContent] = useState(
    selectedPage.content_html
  )
  const editorRef = useRef<HTMLDivElement>(null)

  // On page switch: reset form + seed editor HTML.
  // useLayoutEffect prevents an empty flash before paint.
  useLayoutEffect(() => {
    reset({ title: selectedPage.title, slug: selectedPage.slug })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent(selectedPage.content_html)
    setOriginalContent(selectedPage.content_html)
    if (editorRef.current) {
      editorRef.current.innerHTML = selectedPage.content_html
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPageId])

  // Combined dirty = form fields OR content changed.
  const contentDirty = content !== originalContent
  const isDirty = formDirty || contentDirty

  const wordCount = countWords(content)
  const charCount = countChars(content)

  function handleCommand(command: ToolbarCommand, value?: string) {
    editorRef.current?.focus()
    // formatBlock needs "<h2>" form in some browsers.
    const normalized = command === "formatBlock" && value ? `<${value}>` : value
    // NOTE: execCommand is deprecated but universally supported.
    // Migrate to a proper editor library if inline formatting state
    // (e.g. "bold active" toolbar highlight) becomes necessary.
    document.execCommand(command, false, normalized)
    if (editorRef.current) setContent(editorRef.current.innerHTML)
  }

  async function onSubmit(data: PageFormValues) {
    // TODO: wire to API — PATCH /api/admin/pages/:id
    console.log("Save page", { ...data, content_html: content })
    await new Promise((r) => setTimeout(r, 400))
    setOriginalContent(content)
    reset(data) // reset also clears formDirty
  }

  function handleDiscard() {
    reset({ title: selectedPage.title, slug: selectedPage.slug })
    setContent(originalContent)
    if (editorRef.current) {
      editorRef.current.innerHTML = originalContent
    }
  }

  function handleSelectPage(pageId: string) {
    if (pageId === selectedPageId) return
    if (isDirty && !window.confirm("Discard unsaved changes?")) return
    setSelectedPageId(pageId)
  }

  return (
    <SettingsLayout
      activeTab="pages"
      isDirty={isDirty}
      isSaving={isSubmitting}
      onDiscard={handleDiscard}
      onSave={handleSubmit(onSubmit)}
      saveBarDescription={`Changes made to "${selectedPage.title}" will be visible immediately upon publishing.`}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* ============ LEFT: page list ============ */}
        <aside className="flex flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
          <div className="flex items-center justify-between gap-2 border-b border-(--border-light) px-3 py-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-(--text-muted) uppercase">
              Store content
            </span>
            <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted) tabular-nums">
              {pages.length} items
            </span>
          </div>
          <ul className="flex-1">
            {pages.map((page) => (
              <li key={page.id}>
                <PageListItem
                  page={page}
                  isActive={page.id === selectedPageId}
                  onClick={() => handleSelectPage(page.id)}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => alert("Coming soon")}
            className="flex items-center justify-center gap-1.5 border-t border-(--border-light) px-3 py-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
          >
            <Plus className="size-3.5" />
            Add custom page
          </button>
        </aside>

        {/* ============ RIGHT: editor ============ */}
        <div className="space-y-4">
          {/* Header row */}
          <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold text-(--text-primary)">
                    Edit Page: {selectedPage.title}
                  </h2>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${
                      selectedPage.status === "published"
                        ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
                        : "bg-(--bg-table-header) text-(--text-muted)"
                    }`}
                  >
                    {selectedPage.status === "published" ? "Live" : "Draft"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-(--text-muted)">
                  <span>Public Link:</span>
                  <code className="rounded bg-(--bg-table-header) px-1.5 py-0.5 font-mono">
                    powerzenox.com/{selectedPage.slug}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${import.meta.env.VITE_API_URL}/${selectedPage.slug}`
                      )
                    }
                    className="rounded p-0.5 transition-colors hover:bg-(--bg-table-header)"
                    aria-label="Copy public link"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `${import.meta.env.VITE_API_URL}/${selectedPage.slug}`,
                      "_blank"
                    )
                  }
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <Eye className="size-3.5" /> Preview
                </button>
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-[13px] font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
                >
                  <Save className="size-3.5" />
                  {isSubmitting ? "Saving..." : "Save page"}
                </button>
              </div>
            </div>
          </div>

          {/* Editor card */}
          <div className="space-y-3 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
            {/* Title + slug */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
              <div>
                <label
                  htmlFor="page-title"
                  className="mb-1.5 block text-[11px] font-semibold text-(--text-muted) uppercase"
                >
                  Page title
                </label>
                <input
                  id="page-title"
                  type="text"
                  className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  {...register("title")}
                />
                {errors.title && (
                  <FieldError>{errors.title.message}</FieldError>
                )}
              </div>
              <div className="md:w-64">
                <label
                  htmlFor="page-slug"
                  className="mb-1.5 block text-[11px] font-semibold text-(--text-muted) uppercase"
                >
                  URL slug
                </label>
                <div className="flex h-9 items-center rounded-md border border-(--border-light) bg-(--bg-surface-hover) px-3">
                  <span className="text-[13px] text-(--text-muted)">/</span>
                  <input
                    id="page-slug"
                    type="text"
                    readOnly
                    // Slug is derived from title server-side. Locked here
                    // because changing it after publish breaks inbound links.
                    className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-(--text-primary) outline-none"
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

            {/* Editor body — key forces remount on page switch so innerHTML resets cleanly */}
            <div
              key={selectedPageId}
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              aria-label="Page content"
              onInput={(e) => setContent(e.currentTarget.innerHTML)}
              className="admin-rte min-h-80 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-3 text-[13px] leading-relaxed text-(--text-primary) outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
            />

            {/* Editor footer meta */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-(--border-light) pt-2 text-[11px] text-(--text-muted)">
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
                  Language:{" "}
                  <strong className="text-(--text-primary)">
                    {selectedPage.language}
                  </strong>
                </span>
              </div>
              <span className="inline-flex items-center gap-1">
                <Cloud className="size-3" />
                Synced with local cache
              </span>
            </div>
          </div>

          {/* Bottom cards */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-3">
              <div className="flex items-start gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--bg-surface-hover) text-(--text-muted)">
                  <Search className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[12px] font-semibold text-(--text-primary)">
                    Search Engine Listing
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-(--text-muted)">
                    Customize how this legal page appears on Google search
                    indexing. Clean slugs help with local search
                    trustworthiness.
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-[11px] font-medium text-primary hover:underline"
                  >
                    Edit SEO Meta →
                  </button>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-3">
              <div className="flex items-start gap-2">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--bg-surface-hover) text-(--text-muted)">
                  <History className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[12px] font-semibold text-(--text-primary)">
                    Revision History
                  </h3>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-(--text-muted)">
                    Last updated by {selectedPage.last_edited_by} on{" "}
                    {selectedPage.last_edited_at}. {selectedPage.revision_count}{" "}
                    historic revisions available.
                  </p>
                  <button
                    type="button"
                    className="mt-2 text-[11px] font-medium text-primary hover:underline"
                  >
                    Restore Previous Version
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  )
}
