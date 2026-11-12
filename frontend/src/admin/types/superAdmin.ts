export type SuperAdminUser = {
  id: number
  email: string
  name: string
  mobile: string
  roleId: number
  role: string
  roleDisplayName: string
  shopId: number | null
  shop: { id: number; name: string; slug: string } | null
  status: "active" | "inactive"
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export type UsersListResponse = {
  items: SuperAdminUser[]
  page: number
  limit: number
  total: number
}

export type UserListParams = {
  page?: number
  limit?: number
  q?: string
  roleId?: number
  shopId?: number | "null"
  status?: "active" | "inactive"
}

export type SuperAdminRole = {
  id: number
  name: string
  displayName: string
  scope: "platform" | "shop"
  permissions: Record<string, string[]>
  isSystem: boolean
  description: string
  userCount: number
  createdAt: string
  updatedAt: string
}

export type SuperAdminShop = {
  id: number
  name: string
  slug: string
  status: "active" | "inactive" | "trial"
  mobile: string
  address: string
  trialEndsAt: string | null
  expiryDate: string | null
  userCount: number
  createdAt: string
  updatedAt: string
}

export type CreateUserInput = {
  email: string
  name: string
  mobile?: string
  password: string
  roleId: number
  shopId: number | null
  status: "active" | "inactive"
}

export type UpdateUserInput = {
  name?: string
  mobile?: string
  roleId?: number
  shopId?: number | null
  status?: "active" | "inactive"
}

export type CreateRoleInput = {
  displayName: string
  scope: "platform" | "shop"
  permissions: Record<string, string[]>
  description?: string
}

export type UpdateRoleInput = {
  displayName?: string
  permissions?: Record<string, string[]>
  description?: string
}

export type SuperAdminDashboardData = {
  metrics: {
    totalShops: number
    activeShops: number
    totalUsers: number
    activeUsers: number
  }
  shopsByStatus: { status: string; count: number }[]
  usersByRole: {
    roleId: number
    roleName: string
    roleDisplayName: string
    count: number
  }[]
  recentAudits: {
    id: string
    action: string
    entityType: string | null
    entityId: string | null
    createdAt: string
    user: { id: number; name: string; email: string }
    shop: { id: number; name: string; slug: string } | null
  }[]
  trialExpiringSoon: {
    id: number
    name: string
    slug: string
    trialEndsAt: string | null
  }[]
}

export type SuperAdminShopListItem = {
  id: number
  name: string
  slug: string
  ownerName: string
  ownerMobile: string
  status: "active" | "trial" | "inactive"
  planName: string
  expiresAt: string | null
  userCount: number
}

export type ShopsListResponse = {
  items: SuperAdminShopListItem[]
  page: number
  limit: number
  total: number
  counts: {
    total: number
    active: number
    trial: number
    inactive: number
  }
}
// audit logs
export type AuditLogListItem = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: string
  user: { id: number; name: string; email: string }
  shop: { id: number; name: string; slug: string } | null
}

export type AuditLogResponse = {
  items: AuditLogListItem[]
  page: number
  limit: number
  total: number
}

export type AuditLogQueryParams = {
  page: number
  limit: number
  q?: string
  action?: string
  shopId?: number
}
