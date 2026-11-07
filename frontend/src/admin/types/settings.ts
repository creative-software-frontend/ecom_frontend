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

// Order settings form shape (used by OrdersTab)
export type OrderSettings = {
  duplicate_block: {
    enabled: boolean
    minutes: number
  }
  location_fields: {
    enabled: boolean
  }
  delivery_charges: {
    inside_dhaka: number
    outside_dhaka: number
    free_delivery_above: number
  }
  // Beta features — always disabled in UI for now
  mobile_verification: { enabled: boolean }
  sms_confirmation: { enabled: boolean }
  vpn_protection: { enabled: boolean }
  courier_protection: {
    enabled: boolean
    min_success_ratio: number
  }
}

// Marketing settings — token values are never returned by the API.
// The backend only sends `token_saved` and `token_updated_at`.
export type MarketingIntegration = {
  enabled: boolean
  pixel_id: string
  test_event_code?: string // FB only
  token_saved: boolean
  token_updated_at: string | null
}

export type MarketingSettings = {
  facebook: MarketingIntegration
  tiktok: MarketingIntegration
}
