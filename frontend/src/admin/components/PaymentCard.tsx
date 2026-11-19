import { Info, Copy, ShieldCheck } from "lucide-react"

export type PaymentMethod = "bkash" | "nagad" | "qr"

type PaymentCardProps = {
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
}

const MERCHANT_NUMBER = "018988-79001"

const PAYMENT_STEPS: Record<Exclude<PaymentMethod, "qr">, string[]> = {
  bkash: [
    "আপনার ফোনে bKash অ্যাপটি ওপেন করুন অথবা *247# ডায়াল করুন।",
    "এরপর 'Payment' অপশনে যান।",
    `মার্চেন্ট নম্বর: ${MERCHANT_NUMBER}`,
    "যত টাকা রিচার্জ করতে চান (যেমন: ৫০০, ১০০০ বা ১৫০০ টাকা), পরিমাণটি টাইপ করুন।",
    "আপনার গোপন পিন (PIN) নম্বরটি দিয়ে লেনদেনটি সফলভাবে সম্পন্ন করুন।",
  ],
  nagad: [
    "আপনার ফোনে Nagad অ্যাপটি ওপেন করুন অথবা *167# ডায়াল করুন।",
    "এরপর 'Send Money' বা 'Payment' অপশনে যান।",
    `মার্চেন্ট নম্বর: ${MERCHANT_NUMBER}`,
    "রিচার্জের পরিমাণ টাইপ করুন (যেমন: ৫০০, ১০০০ বা ২০০০ টাকা)।",
    "আপনার Nagad PIN দিয়ে লেনদেনটি নিশ্চিত করুন।",
  ],
}

const QR_STEPS = [
  "QR পেমেন্ট কার্ডে Bangla QR কোডটি খুলুন।",
  "আপনার মোবাইল ব্যাংকিং অ্যাপ থেকে QR স্ক্যান করুন।",
  "যত টাকা রিচার্জ করতে চান, পরিমাণটি লিখে পেমেন্ট করুন।",
  "লেনদেন সফল হলে প্রমাণ হিসেবে TrxID এবং স্ক্রিনশট সংরক্ষণ করুন।",
]

export function PaymentCard({ method, onMethodChange }: PaymentCardProps) {
  const steps = method === "qr" ? QR_STEPS : PAYMENT_STEPS[method]

  return (
    <div className="flex h-full flex-col rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
      <div className="mb-4 flex items-center gap-2">
        <Info className="size-5 text-(--text-muted)" />
        <h2 className="text-sm font-semibold text-(--text-primary)">
          কীভাবে পেমেন্ট করবেন?{" "}
          <span className="text-xs font-normal text-(--text-muted)">
            (Payment Instructions)
          </span>
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="পেমেন্ট মেথড">
        {([
          ["bkash", "bKash"],
          ["nagad", "Nagad"],
          ["qr", "Bangla QR"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={method === value}
            onClick={() => onMethodChange(value)}
            className={`h-9 rounded-md border text-xs font-semibold transition-colors ${
              method === value
                ? "border-(--primary) bg-(--primary-soft) text-(--primary)"
                : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--primary) text-xs font-bold text-white">
              {i + 1}
            </span>
            <p className="mt-0.5 flex-1 text-sm text-(--text-primary)">
              {step}
            </p>
            {method !== "qr" && i === 2 && (
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(MERCHANT_NUMBER)}
                className="flex items-center gap-1 rounded border border-(--border-light) px-2 py-0.5 text-xs text-(--text-muted) hover:bg-(--bg-app)"
              >
                <Copy className="size-3" /> কপি করুন
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-md bg-emerald-50 p-3 text-emerald-800">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-xs font-semibold">
            পেমেন্ট পরবর্তী পদক্ষেপ (Important Next Step):
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed">
            পেমেন্ট সফল হওয়ার পর স্ক্রিনশট নিয়ে আমাদের WhatsApp গ্রুপে পাঠিয়ে
            দিন। অভ্যন্তরীণ টিম ৫ মিনিটের মধ্যে অটোমেটিক রিচার্জ সম্পন্ন করে
            নিবে।
          </p>
        </div>
      </div>
    </div>
  )
}
