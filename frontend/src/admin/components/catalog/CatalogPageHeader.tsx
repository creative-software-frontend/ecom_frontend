import { ArrowLeft, Download, Plus } from "lucide-react"
import { Link } from "react-router"

type CatalogPageHeaderProps = {
  title: string
  subtitle: string
  badgeText: string
  onExport: () => void
  exportDisabled?: boolean
  onAdd: () => void // ← Link বাদ, callback
  addLabel: string
  canAdd?: boolean
}

export function CatalogPageHeader({
  title,
  subtitle,
  badgeText,
  onExport,
  exportDisabled,
  onAdd,
  addLabel,
  canAdd = true,
}: CatalogPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <Link
          to="/shop/products"
          // onClick={onCancel}
          className="mb-1 flex items-center gap-1 text-xs text-(--text-muted) hover:text-(--primary)"
        >
          <ArrowLeft className="size-3" /> Back to products
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold text-(--text-primary)">{title}</h1>
          <span className="rounded-full bg-(--primary-soft) px-2 py-0.5 text-xs font-semibold text-(--primary)">
            {badgeText}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-(--text-muted)">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          disabled={exportDisabled}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" /> Export
        </button>
        {canAdd ? (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
          >
            <Plus className="size-4" /> {addLabel}
          </button>
        ) : null}
      </div>
    </header>
  )
}
