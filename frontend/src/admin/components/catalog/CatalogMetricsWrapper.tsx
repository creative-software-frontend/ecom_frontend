import type { ReactNode } from "react"

export function CatalogMetricsWrapper({ children }: { children: ReactNode }) {
  return (
    <section
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4"
      aria-label="Catalog summary"
    >
      {children}
    </section>
  )
}
