export type CouponStatus = "active" | "paused" | "expired"
export type CouponDiscountType = "percentage" | "amount"
export type CouponEditableStatus = Exclude<CouponStatus, "expired">

export type Coupon = {
  id: number
  code: string
  discountType: CouponDiscountType
  discountValue: number
  note: string | null
  used: number
  usageLimit: number | null
  maxDiscountValue: number | null
  minPurchaseValue: number | null
  expiresAt: string | null
  status: CouponStatus
  createdAt?: string
  updatedAt?: string
}

export type CouponWriteInput = {
  code: string
  discountType: CouponDiscountType
  discountValue: number
  note?: string | null
  usageLimit?: number | null
  maxDiscountValue?: number | null
  minPurchaseValue?: number | null
  expiresAt?: string | null
  status?: CouponEditableStatus
}

export type CouponStatusUpdateInput = {
  status: CouponEditableStatus
}

export type CouponListParams = {
  q?: string
  status?: CouponStatus
}

export type CouponCounts = {
  total: number
  active: number
  paused: number
  expired: number
}

export type CouponsListResponse = {
  items: Coupon[]
  counts: CouponCounts
}
