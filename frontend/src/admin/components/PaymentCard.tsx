import { Info, Copy, ShieldCheck } from "lucide-react"

const STEPS = [
  "আপনার ফোনে bKash অ্যাপটি ওপেন করুন অথবা *247# ডায়াল করুন।",
  "তদন্তে যাকে 'Send Money' অপশনে যান।",
  "প্রাপক নম্বর: 01779-481759",
  "যত টাকা রিচার্জ করতে চান (যেমন: ৫০০, ১০০০ বা ১৫০০ টাকা), পরিমাণটি টাইপ করুন।",
  "আপনার গোপন পিন (PIN) নম্বরটি দিয়ে লেনদেনটি সফলভাবে সম্পন্ন করুন।",
]

export function PaymentCard() {
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

      <div className="flex-1 space-y-3">
        {STEPS.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-(--primary) text-xs font-bold text-white">
              {i + 1}
            </span>
            <p className="mt-0.5 flex-1 text-sm text-(--text-primary)">
              {step}
            </p>
            {i === 2 && (
              <button className="flex items-center gap-1 rounded border border-(--border-light) px-2 py-0.5 text-xs text-(--text-muted) hover:bg-(--bg-app)">
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
