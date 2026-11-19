import { useEffect, useRef, useState } from "react"
import { CheckCircle2, ImagePlus, QrCode, X } from "lucide-react"
import BanglaQR from "@/assets/images/payment/BanglaQR.jpeg"
import type { PaymentMethod } from "./PaymentCard"

type RechargePaymentCardProps = {
  purpose: "sms" | "general"
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
}

export function RechargePaymentCard({
  purpose,
  method,
  onMethodChange,
}: RechargePaymentCardProps) {
  const [showQrPreview, setShowQrPreview] = useState(false)
  const [proofScreenshot, setProofScreenshot] = useState<File | null>(null)
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null)
  const qrCloseButtonRef = useRef<HTMLButtonElement>(null)
  const isSmsRecharge = purpose === "sms"

  useEffect(() => {
    if (!showQrPreview) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowQrPreview(false)
    }

    document.addEventListener("keydown", handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    qrCloseButtonRef.current?.focus()

    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [showQrPreview])

  useEffect(() => {
    return () => {
      if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl)
    }
  }, [proofPreviewUrl])

  return (
    <>
      <div className="flex h-full flex-col rounded-md border border-(--border-light) bg-(--bg-surface) p-4">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-(--text-primary)">
            {isSmsRecharge ? "SMS ব্যালেন্স রিচার্জ" : "অ্যাকাউন্ট রিচার্জ"}
          </h2>
          <p className="text-xs text-(--text-muted)">
            {isSmsRecharge
              ? "SMS gateway balance রিচার্জ করতে পেমেন্টের তথ্য দিন"
              : "আপনার অ্যাকাউন্টে ব্যালেন্স যোগ করতে পেমেন্টের তথ্য দিন"}
          </p>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              কিসের মাধ্যমে পেমেন্ট করতে চান? *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onMethodChange("qr")}
                className={`flex h-10 items-center justify-center rounded-md border font-bold ${method === "qr" ? "border-(--primary) bg-(--primary-soft) text-(--primary)" : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"}`}
              >
                Bangla QR
              </button>
              <button
                onClick={() => onMethodChange("bkash")}
                className={`flex h-10 items-center justify-center rounded-md border font-bold ${method === "bkash" ? "border-(--primary) bg-(--primary-soft) text-(--primary)" : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"}`}
              >
                bKash (বিকাশ)
              </button>
              <button
                onClick={() => onMethodChange("nagad")}
                className={`flex h-10 items-center justify-center rounded-md border font-bold ${method === "nagad" ? "border-(--primary) bg-(--primary-soft) text-(--primary)" : "border-(--border-light) text-(--text-muted) hover:bg-(--bg-app)"}`}
              >
                Nagad (নগদ)
              </button>
            </div>
          </div>

          {method === "qr" && (
            <div className="rounded-md border border-(--border-light) bg-(--bg-app) p-3">
              <div className="mb-2.5 flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-(--primary-soft) text-(--primary)">
                  <QrCode className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-(--text-primary)">
                    Bangla QR পেমেন্ট
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-(--text-muted)">
                    নিরাপদে পেমেন্ট করতে QR কোড খুলুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrPreview(true)}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-md border border-(--primary) bg-(--bg-surface) text-xs font-semibold text-(--primary) transition-colors hover:bg-(--primary-soft) focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:outline-none"
                aria-label="QR কোড ভিউ করুন"
              >
                <QrCode className="size-4" />
                QR কোড দেখুন
              </button>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              {method === "qr"
                ? "যে অ্যাকাউন্ট/নম্বর থেকে পেমেন্ট করেছেন *"
                : "যে নম্বর থেকে টাকা পাঠিয়েছেন *"}
            </label>
            <input
              type={method === "qr" ? "text" : "tel"}
              placeholder={
                method === "qr" ? "অ্যাকাউন্টের নাম বা নম্বর" : "01XXXXXXXXX"
              }
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
              {/* {method === "bkash" ? "bKash" : "Nagad"} */}
              TrxID (লেনদেন আইডি)
            </label>
            <input
              type="text"
              placeholder="যেমন: 9J4K8LMNP"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm outline-none focus:border-(--primary)"
            />
          </div>

          <div>
            <label
              htmlFor="recharge-proof-screenshot"
              className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
            >
              পেমেন্টের স্ক্রিনশট সংযুক্ত করুন *
            </label>
            <label
              htmlFor="recharge-proof-screenshot"
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-dashed border-(--border-light) bg-(--bg-app) px-3 py-2 text-sm text-(--text-muted) transition-colors hover:border-(--primary) hover:text-(--text-primary)"
            >
              <ImagePlus className="size-4 shrink-0" />
              <span className="truncate">
                {proofScreenshot?.name ?? "স্ক্রিনশট নির্বাচন করুন"}
              </span>
            </label>
            <input
              id="recharge-proof-screenshot"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.currentTarget.files?.[0] ?? null
                setProofScreenshot(file)
                setProofPreviewUrl(file ? URL.createObjectURL(file) : null)
              }}
            />
            {proofPreviewUrl && (
              <img
                src={proofPreviewUrl}
                alt="পেমেন্টের স্ক্রিনশট প্রিভিউ"
                className="mt-2 max-h-40 rounded-md border border-(--border-light) object-contain"
              />
            )}
          </div>
        </div>

        <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-(--primary) text-sm font-semibold text-white hover:bg-(--primary-hover)">
          <CheckCircle2 className="size-4" />
          {isSmsRecharge
            ? "SMS ব্যালেন্স রিচার্জ নিশ্চিত করুন"
            : "অ্যাকাউন্ট রিচার্জ নিশ্চিত করুন"}
        </button>
      </div>

      {showQrPreview && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-preview-title"
          onMouseDown={() => setShowQrPreview(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
        >
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-(--border-light) px-4 py-3">
              <div>
                <h2
                  id="qr-preview-title"
                  className="text-sm font-semibold text-(--text-primary)"
                >
                  Bangla QR
                </h2>
                <p className="mt-0.5 text-[11px] text-(--text-muted)">
                  QR স্ক্যান করে পেমেন্ট করুন
                </p>
              </div>
              <button
                ref={qrCloseButtonRef}
                type="button"
                onClick={() => setShowQrPreview(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-(--text-muted) transition-colors hover:bg-(--bg-app) hover:text-(--text-primary) focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:outline-none"
                aria-label="QR preview বন্ধ করুন"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="mx-auto flex max-w-70 flex-col items-center rounded-md border border-(--border-light) bg-white p-3">
                <img
                  src={BanglaQR}
                  alt="Expanded Bangladesh QR payment"
                  className="h-auto max-h-[52vh] w-full object-contain"
                />
              </div>
              <p className="mt-3 text-center text-xs leading-5 text-(--text-muted)">
                আপনার মোবাইল ব্যাংকিং অ্যাপ দিয়ে কোডটি স্ক্যান করুন
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function SmsRechargeCard({
  method,
  onMethodChange,
}: {
  method: PaymentMethod
  onMethodChange: (method: PaymentMethod) => void
}) {
  return (
    <RechargePaymentCard
      purpose="sms"
      method={method}
      onMethodChange={onMethodChange}
    />
  )
}
