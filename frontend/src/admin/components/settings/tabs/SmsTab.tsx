// import { useState } from "react"
import { Wallet, CheckCircle2 } from "lucide-react"
import { SettingsLayout } from "../SettingsLayout"
import { SmsCampaignCard } from "./sms/SmsCampaignCard.tsx"
import { SmsPaymentCard } from "./sms/SmsPaymentCard.tsx"
import { SmsRechargeCard } from "./sms/SmsRechargeCard.tsx"
import { SmsLogsTable } from "./sms/SmsLogsTable"

export default function SmsTab() {
  //   const [showRechargeModal, setShowRechargeModal] = useState(false)

  return (
    <SettingsLayout activeTab="sms">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-(--text-primary)">
              SMS Management
            </h1>
            <p className="mt-0.5 text-sm text-(--text-muted)">
              Send bulk messages, customize dynamic Bengali variables, and top
              up gateway balance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-md border border-(--border-light) bg-(--bg-surface) px-4 py-2">
              <Wallet className="size-4 text-(--primary)" />
              <div>
                <p className="text-[10px] font-semibold tracking-wider text-(--text-muted) uppercase">
                  Gateway Balance
                </p>
                <p className="text-sm font-bold text-(--text-primary) tabular-nums">
                  ৳ 120.40
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // স্ক্রল করে রিচার্জ ফর্মে নিয়ে যাবে
                document
                  .getElementById("recharge-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover)"
            >
              <CheckCircle2 className="size-4" /> Recharge Balance
            </button>
          </div>
        </div>

        {/* 1. Bulk SMS Campaign Area (Full Width) */}
        <SmsCampaignCard />

        {/* 2. Payment & Recharge (2 Columns) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SmsPaymentCard />
          <div id="recharge-section" className="scroll-mt-20">
            <SmsRechargeCard />
          </div>
        </div>

        {/* 3. Logs Table */}
        <SmsLogsTable />
      </div>
    </SettingsLayout>
  )
}
