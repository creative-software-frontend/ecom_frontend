export type CourierSettings = {
  enabled: boolean
  flat_fee_enabled: boolean
  inside_dhaka_fee: number
  sub_dhaka_fee: number
  outside_dhaka_fee: number
  free_delivery_above: number
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
