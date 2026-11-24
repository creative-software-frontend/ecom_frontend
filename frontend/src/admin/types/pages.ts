export type PageStatus = "published" | "draft"

export type PageLanguage = "EN" | "BN" | "EN / BN"

/** Summary row from GET /api/shop/pages. */
export type PageSummary = {
  id: number
  title: string
  slug: string
  status: PageStatus
  language: PageLanguage
  lastEditedBy: string
  revisionCount: number
  createdAt: string
  updatedAt: string
}

/** Full record from GET /api/shop/pages/:id. */
export type PageDetail = PageSummary & {
  contentHtml: string
}

export type PageRevisionItem = {
  id: number
  pageId: number
  title: string
  contentHtml: string
  editedBy: string
  editedAt: string
}

export type PagesListResponse = {
  items: PageSummary[]
}

export type PageRevisionsResponse = {
  items: PageRevisionItem[]
}

export type CreatePageInput = {
  title: string
  slug?: string
  contentHtml?: string
  status?: PageStatus
  language?: PageLanguage
}

export type UpdatePageInput = {
  title: string
  contentHtml: string
  slug?: string
  status?: PageStatus
  language?: PageLanguage
}
