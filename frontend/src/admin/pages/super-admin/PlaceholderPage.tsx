import { Settings } from "lucide-react"

/* Temporary placeholder for super admin pages until Phase A5 builds them. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--bg-table-header) text-(--text-muted)">
        <Settings className="size-5" />
      </span>
      <h1 className="text-lg font-semibold text-(--text-primary)">{title}</h1>
      <p className="max-w-sm text-sm text-(--text-muted)">
        This section is being built in Phase A5. All backend APIs are already
        live — the UI will connect shortly.
      </p>
    </div>
  )
}

export default PlaceholderPage
