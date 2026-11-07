export type CouponStatus = "active" | "paused" | "expired"
export type CouponDiscountType = "percentage" | "amount"

export type Coupon = {
  id: string
  code: string
  discount_type: CouponDiscountType
  discount_value: number
  note?: string // e.g. "Free Delivery" — shown in parentheses in the Discount cell
  used: number
  usage_limit: number | null // null = unlimited (∞ in UI)
  expires_at: string | null // ISO date string; null = no expiry ("Ongoing")
  status: CouponStatus
}
