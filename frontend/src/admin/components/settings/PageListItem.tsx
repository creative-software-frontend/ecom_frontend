/* ================================================================
   PageListItem — list row for the Pages sidebar.
   Active state uses a left accent bar + soft tinted background.
   ================================================================ */

import type { PageSummary } from "@/admin/types/pages"

export function PageListItem({
  page,
  isActive,
  onClick,
}: {
  page: PageSummary
  isActive: boolean
  onClick: () => void
}) {
  const isPublished = page.status === "published"

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full border-l-2 px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "border-l-primary bg-(--primary-soft)"
          : "border-l-transparent hover:bg-(--bg-surface-hover)"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold text-(--text-primary)">
          {page.title}
        </span>
        <span
          className={`shrink-0 rounded-md px-1.5 py-0.5 text-xs font-medium ${
            isPublished
              ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
              : "bg-(--bg-table-header) text-(--text-muted)"
          }`}
        >
          {isPublished ? "Published" : "Draft"}
        </span>
      </div>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className="truncate text-xs text-(--text-muted)">
          /{page.slug}
        </span>
        <span className="shrink-0 text-xs text-(--text-muted)">
          {page.edited_at}
        </span>
      </div>
    </button>
  )
}
