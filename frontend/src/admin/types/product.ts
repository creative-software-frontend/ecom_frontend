export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

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
  images: JsonValue
  orderFormConfig: JsonValue | null
  createdAt: Date
  updatedAt: Date
}

export type ProductCreateInput = Pick<
  Product,
  | "slug"
  | "name"
  | "brandName"
  | "category"
  | "currentPrice"
  | "regularPrice"
  | "discountPercent"
  | "inStock"
  | "stockQuantity"
> & {
  images: string[]
}
