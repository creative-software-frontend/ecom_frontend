import { apiRequest } from "./client"
import { buildQueryString, withQuery } from "./queryParams"

export const TICKET_CATEGORIES = [
  "pickup",
  "delivery",
  "payment",
  "billing",
  "service",
  "other",
] as const
export const TICKET_STATUSES = ["open", "answered", "closed"] as const

export type TicketCategory = (typeof TICKET_CATEGORIES)[number]
export type TicketStatus = (typeof TICKET_STATUSES)[number]

export type SupportPerson = { id: number; name: string }
export type SupportShop = { id: number; name: string; slug: string }

export type SupportMessageDto = {
  id: number
  ticketId: number
  senderId: number
  senderType: "shop" | "support"
  message: string
  createdAt: string
  sender: SupportPerson
}

type SupportTicketBase = {
  id: number
  ticketNumber: string
  shopId: number
  createdById: number
  title: string
  category: TicketCategory
  status: TicketStatus
  lastMessageAt: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export type SupportTicketSummary = SupportTicketBase & {
  preview: string | null
  messageCount: number
  shop?: SupportShop
  createdBy?: SupportPerson
}

export type SupportTicketDetail = SupportTicketBase & {
  createdBy: SupportPerson
  messages: SupportMessageDto[]
  shop?: SupportShop
}

export type SupportTicketsListResponse = {
  items: SupportTicketSummary[]
  counts: {
    total: number
    open: number
    answered: number
    closed: number
  }
}

export type CreateTicketInput = {
  category: TicketCategory
  title?: string
  message: string
}

export type ShopSupportListParams = {
  q?: string
  status?: TicketStatus | "all"
}

export type SuperSupportListParams = ShopSupportListParams & {
  shopId?: number
}

const SHOP_BASE = "/shop/support"
const SUPER_BASE = "/admin/super/support"

export const shopSupportApi = {
  list(
    params: ShopSupportListParams = {},
    signal?: AbortSignal
  ): Promise<SupportTicketsListResponse> {
    const qs = buildQueryString({
      q: params.q?.trim(),
      status: params.status,
    })
    return apiRequest<SupportTicketsListResponse>(withQuery(SHOP_BASE, qs), {
      signal,
    })
  },

  get(id: number, signal?: AbortSignal): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SHOP_BASE}/${id}`, { signal })
  },

  create(input: CreateTicketInput): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(SHOP_BASE, {
      method: "POST",
      body: input,
    })
  },

  reply(id: number, message: string): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SHOP_BASE}/${id}/messages`, {
      method: "POST",
      body: { message },
    })
  },

  close(id: number): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SHOP_BASE}/${id}/close`, {
      method: "PATCH",
    })
  },
}

export const shopSupportQueryKeys = {
  all: ["shop", "support"] as const,
  lists: () => [...shopSupportQueryKeys.all, "list"] as const,
  list: (params: ShopSupportListParams = {}) =>
    [...shopSupportQueryKeys.lists(), params] as const,
  details: () => [...shopSupportQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...shopSupportQueryKeys.details(), id] as const,
}

export const superSupportApi = {
  list(
    params: SuperSupportListParams = {},
    signal?: AbortSignal
  ): Promise<SupportTicketsListResponse> {
    const qs = buildQueryString({
      q: params.q?.trim(),
      status: params.status,
      shopId: params.shopId,
    })
    return apiRequest<SupportTicketsListResponse>(withQuery(SUPER_BASE, qs), {
      signal,
    })
  },

  get(id: number, signal?: AbortSignal): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SUPER_BASE}/${id}`, { signal })
  },

  reply(id: number, message: string): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SUPER_BASE}/${id}/messages`, {
      method: "POST",
      body: { message },
    })
  },

  updateStatus(
    id: number,
    status: TicketStatus
  ): Promise<SupportTicketDetail> {
    return apiRequest<SupportTicketDetail>(`${SUPER_BASE}/${id}/status`, {
      method: "PATCH",
      body: { status },
    })
  },
}

export const superSupportQueryKeys = {
  all: ["admin", "super", "support"] as const,
  lists: () => [...superSupportQueryKeys.all, "list"] as const,
  list: (params: SuperSupportListParams = {}) =>
    [...superSupportQueryKeys.lists(), params] as const,
  details: () => [...superSupportQueryKeys.all, "detail"] as const,
  detail: (id: number) => [...superSupportQueryKeys.details(), id] as const,
}
