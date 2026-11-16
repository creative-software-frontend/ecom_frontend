export type Brand = {
  id: number
  name: string
  slug: string
  logoUrl: string | null
  description?: string
  productCount: number
  isActive: boolean
}

export type Category = {
  id: number
  name: string
  slug: string
  description?: string
  productCount: number
  isActive: boolean
}
