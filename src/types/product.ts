export type Product = {
  id: string
  slug: string
  name: string
  brand_name: string
  page_title: string
  category: string
  form: string
  price: {
    currency: string
    current: number
    regular: number
    discount_percent: number
    display: string
  }
  badge?: string
  tagline: string
  short_description: string
  highlights: string[]
  specs: { label: string }[]
  images: string[]
  problems?: { title: string; description: string }[]
  benefits: { icon?: string; title: string; description: string }[]
  ingredients?: string[]
  trust?: { icon?: string; title: string; description: string }[]
  ingredients_section?: {
    heading: string
    description: string
    items: { name_en: string; name_bn: string; description: string }[]
  }
  promo?: {
    heading: string
    regular_price_label: string
    offer_price_label: string
    offer_price: number
    urgency: string
  }
  in_stock: boolean
  stock_note?: string
  order_form: { enabled: boolean } & Record<string, unknown>
  cta: {
    order_label: string
    call_label: string
    whatsapp_url: string
  } & Record<string, unknown>
}

export interface ProductTheme {
  bg: string
  sectionBg?: string
  textColor: string
  primaryTextColor?: string
  primaryBgColor?: string
}

export type Store = {
  store: {
    name: string
    url: string
    tagline: string
    currency: string
    currency_symbol: string
    language: string
    contact: { phone: string; whatsapp: string }
    delivery: {
      method: string
      note: string
      free_delivery: boolean
      delivery_charge: number
    }
  }
  products: Product[]
}

export interface ProductCardProps {
  product: Product
}

export interface ProductPreviewSectionProps {
  product: Product | null
}

export interface ProductTheme {
  bg: string
  sectionBg?: string
  textColor: string
  primaryTextColor?: string
  primaryBgColor?: string
  appearance?: "light" | "dark"
  badgeBgColor?: string
  badgeOutlineColor?: string
  descriptionTextColor?: string
  productImageShadow?: string
}
