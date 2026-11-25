export type CourierSettings = {
  enabled: boolean
  flat_fee_enabled: boolean
  inside_dhaka_fee: number
  sub_dhaka_fee: number
  outside_dhaka_fee: number
  free_delivery_above: number
}

export type CourierSlug = "steadfast" | "pathao" | "redx" | "carrybee"

export type CourierAccountStatus =
  | "not_connected"
  | "ready"
  | "connected"
  | "error"

export type CourierAccount = {
  id: number
  shopId: number
  slug: CourierSlug
  enabled: boolean
  baseUrl: string | null
  clientId: string | null
  username: string | null
  storeId: string | null
  clientContext: string | null
  status: CourierAccountStatus
  statusMessage: string | null
  balance: number | null
  checkedAt: string | null
  // Secrets are never sent by the server — only these flags and previews.
  hasApiKey: boolean
  hasSecretKey: boolean
  hasClientSecret: boolean
  hasPassword: boolean
  hasAccessToken: boolean
  apiKeyPreview: string | null
  secretKeyPreview: string | null
  clientSecretPreview: string | null
  passwordPreview: string | null
  accessTokenPreview: string | null
  updatedAt: string
}

export type UpdateCourierAccountInput = {
  enabled?: boolean
  baseUrl?: string | null
  clientId?: string | null
  username?: string | null
  storeId?: string | null
  clientContext?: string | null
  // Omit / send an empty string to preserve the stored encrypted value.
  apiKey?: string
  secretKey?: string
  clientSecret?: string
  password?: string
  accessToken?: string
}

// Zones are hardcoded per design: "strictly predefined for Bangladesh".
// Only the `feeKey` links to a mutable backend field.
export type CourierZoneDef = {
  id: "inside_dhaka" | "sub_dhaka" | "outside_dhaka"
  nameEn: string
  nameBn: string
  zoneId: string
  districts: string[]
  feeKey: "inside_dhaka_fee" | "sub_dhaka_fee" | "outside_dhaka_fee"
}

export const COURIER_ZONES: CourierZoneDef[] = [
  {
    id: "inside_dhaka",
    nameEn: "Inside Dhaka",
    nameBn: "ঢাকা শহর",
    zoneId: "BD-DHK-CORE",
    districts: ["Dhaka City (DNCC & DSCC)"],
    feeKey: "inside_dhaka_fee",
  },
  {
    id: "sub_dhaka",
    nameEn: "Sub-Dhaka",
    nameBn: "ঢাকা সাব-শহর",
    zoneId: "BD-DHK-SUB",
    districts: ["Gazipur", "Savar", "Narayanganj", "Keraniganj", "Tongi"],
    feeKey: "sub_dhaka_fee",
  },
  {
    id: "outside_dhaka",
    nameEn: "Outside Dhaka",
    nameBn: "ঢাকার বাইরে",
    zoneId: "BD-NAT-ALL",
    districts: ["All other 61 districts (Standard Catch-all)"],
    feeKey: "outside_dhaka_fee",
  },
]
