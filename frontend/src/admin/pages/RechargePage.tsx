import { ArrowLeft, Wallet } from "lucide-react"
import { useNavigate } from "react-router"
import { useState } from "react"
import { RechargePaymentCard } from "../components/RechargeCard"
import { PaymentCard } from "../components/PaymentCard"
import type { PaymentMethod } from "../components/PaymentCard"
import { RechargeHistory } from "../components/recharge/RechargeHistory"

export default function RechargePage() {
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("qr")

  return (
    <div className="flex flex-col gap-5 bg-(--bg-app) p-4 sm:p-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-(--text-muted) hover:text-(--text-primary)"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <Wallet className="size-5 text-(--primary)" />
          <h1 className="text-xl font-semibold text-(--text-primary)">
            Account Recharge
          </h1>
        </div>
        <p className="mt-1 text-sm text-(--text-muted)">
          আপনার সাধারণ অ্যাকাউন্ট ব্যালেন্সে টাকা যোগ করুন। SMS gateway balance
          রিচার্জের জন্য SMS Management ব্যবহার করুন।
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PaymentCard method={paymentMethod} onMethodChange={setPaymentMethod} />
        <RechargePaymentCard
          purpose="general"
          method={paymentMethod}
          onMethodChange={setPaymentMethod}
        />
      </div>

      <RechargeHistory
        purpose="general"
        title="Recharge History"
        description="All account balance recharges and their statuses"
      />
    </div>
  )
}
