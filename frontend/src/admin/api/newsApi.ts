import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"

export const NEWS_CATEGORIES = [
  "charge",
  "integration",
  "notice",
  "general",
] as const
export const NEWS_STATUSES = ["published", "draft"] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]
export type NewsStatus = (typeof NEWS_STATUSES)[number]

export type NewsItemDto = {
  id: number
  title: string
  description: string | null
  category: NewsCategory
  isPinned: boolean
  status: NewsStatus
  publishedAt: string
  createdById: number
  createdBy?: { id: number; name: string }
  createdAt: string
  updatedAt: string
}

export type NewsWriteInput = {
  title: string
  description?: string | null
  category?: NewsCategory
  isPinned?: boolean
  status?: NewsStatus
  /** `YYYY-MM-DD` or an ISO datetime; omitted values default server-side. */
  publishedAt?: string | null
}

export type ShopNewsListParams = {
  q?: string
  category?: NewsCategory | "all"
}

export type SuperNewsListParams = ShopNewsListParams & {
  status?: NewsStatus | "all"
}

export type SuperNewsListResponse = {
  items: NewsItemDto[]
  counts: {
    total: number
    published: number
    draft: number
    pinned: number
  }
}

export type ShopNewsListResponse = {
  items: NewsItemDto[]
  totalPublished: number
}

const SHOP_BASE = "/shop/news"
const SUPER_BASE = "/admin/super/news"

export const shopNewsApi = {
  list(
    params: ShopNewsListParams = {},
    signal?: AbortSignal
  ): Promise<ShopNewsListResponse> {
    const qs = buildQueryString({
      q: params.q?.trim(),
      category: params.category,
    })
    return apiRequest<ShopNewsListResponse>(withQuery(SHOP_BASE, qs), {
      signal,
    })
  },
}

export const shopNewsQueryKeys = {
  all: ["shop", "news"] as const,
  lists: () => [...shopNewsQueryKeys.all, "list"] as const,
  list: (params: ShopNewsListParams = {}) =>
    [...shopNewsQueryKeys.lists(), params] as const,
}

export const superNewsApi = {
  list(
    params: SuperNewsListParams = {},
    signal?: AbortSignal
  ): Promise<SuperNewsListResponse> {
    const qs = buildQueryString({
      q: params.q?.trim(),
      category: params.category,
      status: params.status,
    })
    return apiRequest<SuperNewsListResponse>(withQuery(SUPER_BASE, qs), {
      signal,
    })
  },

  create(input: NewsWriteInput): Promise<NewsItemDto> {
    return apiRequest<NewsItemDto>(SUPER_BASE, {
      method: "POST",
      body: input,
    })
  },

  update(id: number, input: Partial<NewsWriteInput>): Promise<NewsItemDto> {
    return apiRequest<NewsItemDto>(`${SUPER_BASE}/${id}`, {
      method: "PUT",
      body: input,
    })
  },

  remove(id: number): Promise<void> {
    return apiRequest<void>(`${SUPER_BASE}/${id}`, { method: "DELETE" })
  },
}

export const superNewsQueryKeys = {
  all: ["admin", "super", "news"] as const,
  lists: () => [...superNewsQueryKeys.all, "list"] as const,
  list: (params: SuperNewsListParams = {}) =>
    [...superNewsQueryKeys.lists(), params] as const,
}
