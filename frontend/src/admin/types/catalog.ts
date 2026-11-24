export type CatalogStatusFilter = "all" | "active" | "inactive"
export type CategoryLevelFilter = "all" | "parent" | "subcategory"

export type CatalogCounts = {
  total: number
  active: number
  inactive: number
  linkedProducts: number
  empty: number
}

export type CategoryCounts = CatalogCounts & {
  parents: number
  subcategories: number
}

export type Brand = {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  description: string | null
  productCount: number
  isActive: boolean
}

export type Category = {
  id: number
  parentId: number | null
  parentName: string | null
  childrenCount: number
  name: string
  slug: string
  description: string | null
  productCount: number
  isActive: boolean
  /** Raw relation/count objects from the API, kept for callers that need them. */
  parent?: { id: number; name: string } | null
  _count?: { children: number }
}

export type BrandWriteInput = {
  name: string
  logoUrl?: string | null
  description?: string | null
  isActive?: boolean
}

export type CategoryWriteInput = {
  name: string
  parentId?: number | null
  description?: string | null
  isActive?: boolean
}

export type BrandListParams = {
  q?: string
  status?: CatalogStatusFilter
}

export type CategoryListParams = BrandListParams & {
  level?: CategoryLevelFilter
}

export type BrandListResponse = {
  items: Brand[]
  counts: CatalogCounts
}

export type CategoryListResponse = {
  items: Category[]
  counts: CategoryCounts
}

export type CatalogOption = {
  id: number
  name: string
  slug: string
}

export type CategoryOption = CatalogOption & {
  parentId: number | null
}

export type SuperCatalogOptions = {
  brands: CatalogOption[]
  categories: CategoryOption[]
}
