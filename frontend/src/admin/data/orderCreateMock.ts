import type {
  CourierService,
  OrderSource,
  PickerProduct,
  ShippingZone,
  TeamMember,
} from "../types/order"

export const SHIPPING_ZONES: ShippingZone[] = [
  { id: "inside-dhaka", name: "Inside Dhaka", fee: 60 },
  { id: "sub-dhaka", name: "Sub-Dhaka", fee: 100 },
  { id: "outside-dhaka", name: "Outside Dhaka", fee: 130 },
  { id: "free", name: "Free Delivery", fee: 0 },
]

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

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "me", name: "Assign to me (default)", role: "Shop Admin" },
  { id: "fatema", name: "Fatema Khan", role: "Salesman" },
  { id: "kazi", name: "Kazi Rahman", role: "Order Handler" },
  { id: "nusrat", name: "Nusrat Jahan", role: "Product Uploader" },
]

export const MOCK_PICKER_PRODUCTS: PickerProduct[] = [
  {
    id: 1,
    name: "Ultra Hot Capsules",
    price: 1600,
    image: null,
    sku: "PZ-UH-001",
  },
  {
    id: 2,
    name: "JINGSENG PLUS",
    price: 1700,
    image: null,
    sku: "PZ-JP-002",
  },
  {
    id: 3,
    name: "Ling Long Capsules",
    price: 1500,
    image: null,
    sku: "PZ-LL-003",
  },
  {
    id: 4,
    name: "Zenox Tonic",
    price: 850,
    image: null,
    sku: "PZ-ZT-004",
  },
]
