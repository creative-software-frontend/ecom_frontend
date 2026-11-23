import { ArrowLeft } from "lucide-react"
import { useNavigate, useSearchParams } from "react-router"
import { RechargeHistory } from "../components/recharge/RechargeHistory"
import type { RechargePurpose } from "../types/recharge"

export default function RechargeHistoryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const purposeParam = searchParams.get("purpose")
  const purpose: RechargePurpose = purposeParam === "sms" ? "sms" : "general"

  function changePurpose(nextPurpose: RechargePurpose) {
    setSearchParams({ purpose: nextPurpose })
  }

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-(--text-primary)">
              Recharge History
            </h1>
            <p className="mt-1 text-sm text-(--text-muted)">
              সব রিচার্জ লেনদেন এবং তার বর্তমান স্ট্যাটাস দেখুন।
            </p>
          </div>

          <div className="flex rounded-md border border-(--border-light) bg-(--bg-surface) p-1">
            <button
              type="button"
              onClick={() => changePurpose("general")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                purpose === "general"
                  ? "bg-(--primary) text-white"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              অ্যাকাউন্ট রিচার্জ
            </button>
            <button
              type="button"
              onClick={() => changePurpose("sms")}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                purpose === "sms"
                  ? "bg-(--primary) text-white"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              SMS রিচার্জ
            </button>
          </div>
        </div>
      </div>

      <RechargeHistory
        purpose={purpose}
        title={
          purpose === "sms"
            ? "SMS Recharge History"
            : "Account Recharge History"
        }
        description={
          purpose === "sms"
            ? "Payments made to top up your SMS gateway balance"
            : "All account balance recharges and their statuses"
        }
      />
    </div>
  )
}
