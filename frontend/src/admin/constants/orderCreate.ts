import type {
  CourierService,
  OrderSource,
  ShippingZone,
} from "../types/order"

export const COURIER_SERVICES: CourierService[] = [
  { id: "steadfast", name: "Steadfast" },
  { id: "pathao", name: "Pathao" },
  { id: "redx", name: "RedX" },
  { id: "carrybee", name: "Carrybee" },
]

export const ORDER_SOURCES: OrderSource[] = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "facebook", name: "Facebook" },
  { id: "phone", name: "Phone Call" },
  { id: "website", name: "Website" },
  { id: "walk-in", name: "Walk-in" },
]

type CourierFees = {
  inside_dhaka_fee: number
  sub_dhaka_fee: number
  outside_dhaka_fee: number
}

export function buildShippingZones(fees?: CourierFees | null): ShippingZone[] {
  return [
    {
      id: "inside-dhaka",
      name: "Inside Dhaka",
      fee: fees?.inside_dhaka_fee ?? 60,
    },
    {
      id: "sub-dhaka",
      name: "Sub-Dhaka",
      fee: fees?.sub_dhaka_fee ?? 100,
    },
    {
      id: "outside-dhaka",
      name: "Outside Dhaka",
      fee: fees?.outside_dhaka_fee ?? 130,
    },
    { id: "free", name: "Free Delivery", fee: 0 },
  ]
}

/** Fallback fees for Super Admin, who has no shop-scoped courier settings. */
export const DEFAULT_SHIPPING_ZONES = buildShippingZones()
