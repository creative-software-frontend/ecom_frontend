// Expanded for the Settings redesign (Store tab uses all fields below).
// Legacy fields kept optional so existing code doesn't break until API migration.

export type StoreContact = {
  phone: string
  phone_2: string
  whatsapp: string
  whatsapp_2: string
  email: string
  address: string
  google_maps_url: string
}

export type StoreSocial = {
  facebook: string
  instagram: string
  youtube: string
  tiktok: string
}

export type StoreDelivery = {
  method: string
  note: string
  free_delivery: boolean
  delivery_charge: number
}

export type StoreSettings = {
  // General
  name: string
  tagline: string
  description: string
  logo: string | null

  // Contact
  contact: StoreContact

  // Social
  social: StoreSocial

  // Legacy fields (kept optional for backward compatibility)
  url?: string
  currency?: string
  currency_symbol?: string
  language?: string
  delivery?: StoreDelivery
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

//  store frontend settings
export type Banner = {
  id: string
  image: string | null
  alt: string
  link: string
  active: boolean
}

export type StorefrontAnnouncement = {
  enabled: boolean
  marquee_text: string
  order_note: string
}

export type StorefrontBrandColors = {
  primary: string
  background: string
}

export type StorefrontSettings = {
  announcement: StorefrontAnnouncement
  banners: Banner[]
  brand_colors: StorefrontBrandColors
}
