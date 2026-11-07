import type { ReactNode } from "react"
import { useNavigate } from "react-router"
import {
  Store,
  ShoppingBag,
  Package,
  Ticket,
  FileText,
  Megaphone,
  AlertCircle,
} from "lucide-react"

/* ================================================================
   Tabs configuration
   ================================================================ */

export type SettingsTabId =
  "store" | "storefront" | "orders" | "coupons" | "pages" | "marketing"

const TABS: {
  id: SettingsTabId
  label: string
  icon: typeof Store
}[] = [
  { id: "store", label: "Store", icon: Store },
  { id: "storefront", label: "Storefront", icon: ShoppingBag },
  { id: "orders", label: "Orders", icon: Package },
  { id: "coupons", label: "Coupons", icon: Ticket },
  { id: "pages", label: "Pages", icon: FileText },
  { id: "marketing", label: "Marketing", icon: Megaphone },
]

/* ================================================================
   SettingsCard — reusable content card
   ================================================================ */

export function SettingsCard({
  title,
  description,
  badge,
  children,
}: {
  title: string
  description?: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-(--border-light) bg-(--bg-surface)">
      <header className="flex items-start justify-between gap-3 border-b border-(--border-light) px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold text-(--text-primary)">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[12px] text-(--text-muted)">
              {description}
            </p>
          )}
        </div>
        {badge}
      </header>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  )
}

/* ================================================================
   SaveBar — sticky bottom when dirty
   ================================================================ */

function SaveBar({
  isDirty,
  isSaving,
  onDiscard,
  onSave,
  description,
}: {
  isDirty: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
  description?: string
}) {
  if (!isDirty) return null

  return (
    <div className="sticky bottom-0 z-10 -mx-6 border-t border-(--border-light) bg-(--bg-surface) px-6 py-3 shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Warning variant (orange filled) when description is present */}
          {description ? (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-orange-500">
              <AlertCircle className="size-3.5 text-white" />
            </span>
          ) : (
            <AlertCircle className="size-4 shrink-0 text-amber-500" />
          )}
          <div className="flex flex-col">
            <span className="text-[12px] font-medium text-(--text-primary)">
              You have unsaved changes
            </span>
            {description && (
              <span className="text-[11px] text-(--text-muted)">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-[13px] font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  )
}
/* ================================================================
   SettingsLayout — wraps every settings tab
   ================================================================ */

export function SettingsLayout({
  activeTab,
  children,
  isDirty = false,
  isSaving = false,
  onDiscard,
  onSave,
  badges,
  saveBarDescription,
}: {
  activeTab: SettingsTabId
  children: ReactNode
  isDirty?: boolean
  isSaving?: boolean
  onDiscard?: () => void
  onSave?: () => void
  badges?: Partial<Record<SettingsTabId, number>>
  saveBarDescription?: string
}) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5 bg-(--bg-app) p-4 sm:p-6">
      {/* Page header */}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[11px] text-(--text-muted)">
            <span>Configuration</span>
            <span>›</span>
            <span>Store Settings</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Production Environment
          </span>
        </div>
        <h1 className="mt-2 text-[20px] font-semibold text-(--text-primary)">
          Settings
        </h1>
        <p className="mt-0.5 text-[13px] text-(--text-muted)">
          Manage your store, orders and customer-facing operational channels
        </p>
      </header>

      {/* Tab navigation */}
      <nav
        aria-label="Settings sections"
        className="-mx-4 overflow-x-auto border-b border-(--border-light) px-4 sm:-mx-6 sm:px-6"
      >
        <div className="flex min-w-max gap-0">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = id === activeTab
            const badgeCount = badges?.[id] ?? 0
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(`/admin/settings/${id}`)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-(--text-muted) hover:text-(--text-primary)"
                }`}
              >
                <Icon className="size-4" />
                {label}
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-semibold text-(--text-muted) tabular-nums">
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <div className="flex flex-col gap-4">{children}</div>

      {/* Sticky save bar */}
      {onSave && onDiscard && (
        <SaveBar
          isDirty={isDirty}
          isSaving={isSaving}
          onDiscard={onDiscard}
          onSave={onSave}
          description={saveBarDescription}
        />
      )}
    </div>
  )
}
