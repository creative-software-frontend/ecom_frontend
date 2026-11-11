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
