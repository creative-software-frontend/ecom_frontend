import { apiRequest } from "./client"
import type {
  CreatePageInput,
  PageDetail,
  PageRevisionsResponse,
  PagesListResponse,
  UpdatePageInput,
} from "../types/pages"

export const pagesApi = {
  list(signal?: AbortSignal): Promise<PagesListResponse> {
    return apiRequest<PagesListResponse>("/shop/pages", { signal })
  },

  get(id: number, signal?: AbortSignal): Promise<PageDetail> {
    return apiRequest<PageDetail>(`/shop/pages/${encodeURIComponent(String(id))}`, {
      signal,
    })
  },

  create(input: CreatePageInput): Promise<PageDetail> {
    return apiRequest<PageDetail>("/shop/pages", {
      method: "POST",
      body: input,
    })
  },

  update(id: number, input: UpdatePageInput): Promise<PageDetail> {
    return apiRequest<PageDetail>(`/shop/pages/${encodeURIComponent(String(id))}`, {
      method: "PUT",
      body: input,
    })
  },

  revisions(id: number, signal?: AbortSignal): Promise<PageRevisionsResponse> {
    return apiRequest<PageRevisionsResponse>(
      `/shop/pages/${encodeURIComponent(String(id))}/revisions`,
      { signal }
    )
  },

  restoreRevision(pageId: number, revisionId: number): Promise<PageDetail> {
    return apiRequest<PageDetail>(
      `/shop/pages/${encodeURIComponent(String(pageId))}/revisions/${encodeURIComponent(String(revisionId))}/restore`,
      { method: "POST" }
    )
  },

  remove(id: number): Promise<void> {
    return apiRequest<void>(`/shop/pages/${encodeURIComponent(String(id))}`, {
      method: "DELETE",
    })
  },
}

export const pageQueryKeys = {
  all: ["admin", "pages"] as const,
  lists: () => [...pageQueryKeys.all, "list"] as const,
  list: () => pageQueryKeys.lists(),
  detail: (id: number) => [...pageQueryKeys.all, "detail", id] as const,
  revisions: (id: number) => [...pageQueryKeys.all, "revisions", id] as const,
}
