import { type ReactNode } from "react"
import { useNavigate } from "react-router"
import {
  Store,
  ShoppingBag,
  Package,
  Ticket,
  FileText,
  Megaphone,
  AlertCircle,
  Truck,
  Loader2,
} from "lucide-react"

/* ================================================================
   Tabs configuration
   ================================================================ */

export type SettingsTabId =
  | "store"
  | "storefront"
  | "orders"
  | "coupons"
  | "pages"
  | "marketing"
  | "courier"

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
  { id: "courier", label: "Courier", icon: Truck },
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
          <h2 className="text-sm font-semibold text-(--text-primary)">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-xs text-(--text-muted)">{description}</p>
          )}
        </div>
        {badge}
      </header>
      <div className="space-y-5 px-5 py-5">{children}</div>
    </section>
  )
}

/* ================================================================
   SettingsSkeleton — polished loading state for settings tabs
   ================================================================ */

export function SettingsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading settings"
      className="flex flex-col gap-5 animate-pulse"
    >
      {/* Skeleton Card 1 */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-5">
        <div className="flex items-center justify-between border-b border-(--border-light) pb-4">
          <div className="space-y-1.5">
            <div className="h-4 w-36 rounded bg-(--bg-surface-hover)" />
            <div className="h-3 w-64 rounded bg-(--bg-surface-hover)" />
          </div>
          <div className="h-6 w-16 rounded-full bg-(--bg-surface-hover)" />
        </div>
        <div className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-(--bg-surface-hover)" />
            <div className="h-9 w-full rounded-md bg-(--bg-surface-hover)" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-24 rounded bg-(--bg-surface-hover)" />
            <div className="h-9 w-full rounded-md bg-(--bg-surface-hover)" />
          </div>
          <div className="col-span-full space-y-2">
            <div className="h-3 w-28 rounded bg-(--bg-surface-hover)" />
            <div className="h-20 w-full rounded-md bg-(--bg-surface-hover)" />
          </div>
        </div>
      </div>

      {/* Skeleton Card 2 */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) p-5">
        <div className="border-b border-(--border-light) pb-4">
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-(--bg-surface-hover)" />
            <div className="h-3 w-52 rounded bg-(--bg-surface-hover)" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-2">
          <div className="h-10 rounded-md bg-(--bg-surface-hover)" />
          <div className="h-10 rounded-md bg-(--bg-surface-hover)" />
        </div>
      </div>
    </div>
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
  title,
}: {
  isDirty: boolean
  isSaving: boolean
  onDiscard: () => void
  onSave: () => void
  description?: string
  title?: string
}) {
  if (!isDirty) return null

  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t border-(--border-light) bg-(--bg-surface) px-4 py-3 shadow-[0_-4px_12px_-4px_rgba(15,23,42,0.06)] sm:-mx-6 sm:px-6">
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
            <span className="text-xs font-medium text-(--text-primary)">
              {title ?? "You have unsaved changes"}
            </span>
            {description && (
              <span className="text-xs text-(--text-muted)">{description}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={isSaving}
            className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save changes</span>
            )}
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
  isLoading = false,
  onDiscard,
  onSave,
  badges,
  saveBarDescription,
  headerRight,
  saveBarTitle,
}: {
  activeTab: SettingsTabId
  children: ReactNode
  isDirty?: boolean
  isSaving?: boolean
  isLoading?: boolean
  onDiscard?: () => void
  onSave?: () => void
  badges?: Partial<Record<SettingsTabId, number>>
  saveBarDescription?: string
  headerRight?: ReactNode
  saveBarTitle?: string
  pageTitle?: string
  pageSubtitle?: string
}) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5 bg-(--bg-app) p-4 sm:p-6">
      {/* Page header */}
      <header>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-(--text-muted)">
            <span>Configuration</span>
            <span>›</span>
            <span>Store Settings</span>
          </div>
          {headerRight ?? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Production Environment
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="mt-2 text-xl font-semibold text-(--text-primary)">
            Settings
          </h1>
          {isLoading && (
            <span
              className="mt-2 inline-flex items-center gap-1 text-xs text-(--text-muted)"
              role="status"
            >
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Loading...</span>
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-(--text-muted)">
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
                onClick={() => navigate(`/shop/settings/${id}`)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-(--text-muted) hover:text-(--text-primary)"
                }`}
              >
                <Icon className="size-4" />
                {label}
                {badgeCount !== undefined && badgeCount > 0 && (
                  <span className="ml-0.5 rounded-full bg-(--bg-table-header) px-1.5 py-0.5 text-xs font-semibold text-(--text-muted) tabular-nums">
                    {badgeCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content or Skeleton Loader */}
      {isLoading ? (
        <SettingsSkeleton />
      ) : (
        <div className="flex flex-col gap-4">{children}</div>
      )}

      {/* Sticky save bar */}
      {onSave && onDiscard && (
        <SaveBar
          isDirty={isDirty}
          isSaving={isSaving}
          onDiscard={onDiscard}
          onSave={onSave}
          description={saveBarDescription}
          title={saveBarTitle}
        />
      )}
    </div>
  )
}
