export type RechargeStatus = "success" | "pending" | "failed" | "expired"
export type RechargeMethod = "bkash" | "nagad" | "qr"
export type RechargePurpose = "sms" | "general"

export type RechargeRecord = {
  id: string
  trxId: string
  amount: number
  method: RechargeMethod
  status: RechargeStatus
  purpose: RechargePurpose
  createdAt: string
  completedAt: string | null
  note: string | null
}
