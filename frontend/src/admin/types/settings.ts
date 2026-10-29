export type StoreContact = {
  phone: string
  whatsapp: string
}

export type StoreDelivery = {
  method: string
  note: string
  free_delivery: boolean
  delivery_charge: number
}

export type StoreSettings = {
  name: string
  url: string
  tagline: string
  currency: string
  currency_symbol: string
  language: string
  contact: StoreContact
  delivery: StoreDelivery
}

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
}

