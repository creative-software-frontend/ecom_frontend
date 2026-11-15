import { useState } from "react"
import { CheckCircle2 } from "lucide-react"

export function SmsRechargeCard() {
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash")

  return (
    <div className="flex h-full flex-col rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-(--text-primary)">
          রিচার্জের তথ্য দিন
        </h2>
        <p className="text-xs text-(--text-muted)">
          Submit recharge transaction details for instant credit
        </p>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
            কিসের মাধ্যমে পেমেন্ট করেছেন? *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setMethod("bkash")}
              className={`flex h-10 items-center justify-center rounded-md border font-bold ${method === "bkash" ? "border-(--primary) bg-(--primary-soft) text-(--primary)" : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"}`}
            >
              bKash (বিকাশ)
            </button>
            <button
              onClick={() => setMethod("nagad")}
              className={`flex h-10 items-center justify-center rounded-md border font-bold ${method === "nagad" ? "border-(--primary) bg-(--primary-soft) text-(--primary)" : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"}`}
            >
              Nagad (নগদ)
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
            যে নম্বর থেকে টাকা পাঠিয়েছেন *
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
            যত টাকা রিচার্জ করেছেন *
          </label>
          <input
            type="number"
            placeholder="৳ 500"
            className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
          />
          <div className="mt-2 flex gap-2">
            {[500, 1000, 2000].map((amt) => (
              <button
                key={amt}
                className="rounded border border-(--border-light) px-2 py-0.5 text-xs text-(--text-muted) hover:bg-(--bg-app)"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
            {method === "bkash" ? "bKash" : "Nagad"} TrxID (লেনদেন আইডি)
          </label>
          <input
            type="text"
            placeholder="যেমন: 9J4K8LMNP"
            className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
          />
        </div>
      </div>

      <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-(--primary) text-sm font-semibold text-white hover:bg-(--primary-hover)">
        <CheckCircle2 className="size-4" /> রিচার্জ নিশ্চিত করুন (Confirm
        Request)
      </button>
    </div>
  )
}
