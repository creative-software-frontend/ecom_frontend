export type PageStatus = "published" | "draft"

export type PageSummary = {
  id: string
  title: string
  slug: string
  status: PageStatus
  edited_at: string // human-readable, e.g. "Edited 3d ago"
}

export type PageDetail = PageSummary & {
  content_html: string
  language: "EN" | "BN" | "EN / BN"
  last_edited_by: string
  last_edited_at: string
  revision_count: number
}
