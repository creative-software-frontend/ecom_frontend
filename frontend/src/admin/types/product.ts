export type Product = {
  id: string
  slug: string
  name: string
  brandName: string
  category: string
  currentPrice: number
  regularPrice: number
  discountPercent: number
  inStock: boolean
  stockQuantity: number
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductWriteInput = {
  name: string
  brandName: string
  category: string
  slug: string
  regularPrice: number
  currentPrice: number
  stockQuantity: number
  images: string[]
  isActive: boolean
}
