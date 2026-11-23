import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  ImagePlus,
  QrCode,
  X,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react"
import BanglaQR from "@/assets/images/payment/BanglaQR.jpeg"
import type { PaymentMethod } from "./PaymentCard"
import { apiRequest, ApiError } from "../api/client"

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

  // Auto-extracted field values
  const [accountValue, setAccountValue] = useState("")
  const [trxIdValue, setTrxIdValue] = useState("")
  const [amountValue, setAmountValue] = useState("")

  // Extraction states
  const [extracting, setExtracting] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)

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

  async function handleScreenshotChange(file: File | null) {
    if (!file) return

    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl)

    setProofScreenshot(file)
    setProofPreviewUrl(URL.createObjectURL(file))
    setExtracting(true)
    setExtracted(false)
    setExtractionError(null)
    setAccountValue("")
    setTrxIdValue("")
    setAmountValue("")

    try {
      const formData = new FormData()
      formData.append("screenshot", file)

      const result = await apiRequest<{
        trxId: string | null
        account: string | null
        amount: number | null
        confidence: number
      }>("/shop/recharge/extract", {
        method: "POST",
        body: formData,
      })

      if (result.trxId) setTrxIdValue(result.trxId)
      if (result.account) setAccountValue(result.account)
      if (result.amount) setAmountValue(String(result.amount))

      // Low confidence → warn user to verify
      if (result.confidence < 70) {
        setExtractionError(
          "কিছু তথ্য পড়া যায়নি — দয়া করে ম্যানুয়ালি যাচাই করুন"
        )
      }
      setExtracted(true)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "স্ক্রিনশট পড়া যায়নি — ম্যানুয়ালি তথ্য পূরণ করুন"
      setExtractionError(message)
    } finally {
      setExtracting(false)
    }
  }

  function handleRemoveScreenshot() {
    if (proofPreviewUrl) URL.revokeObjectURL(proofPreviewUrl)
    setProofScreenshot(null)
    setProofPreviewUrl(null)
    setExtracting(false)
    setExtracted(false)
    // Keep account/trxId values so user doesn't lose typed corrections
  }

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
          {/* ── Payment method ────────────────────────────── */}
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

          {/* ── QR preview (only if QR) ───────────────────── */}
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

          {/* ── Screenshot upload (BIG, FIRST) ────────────── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              পেমেন্টের স্ক্রিনশট *{" "}
              <span className="text-[11px] font-normal text-(--text-muted)">
                (TrxID ও অ্যাকাউন্ট অটো-ফিল হবে)
              </span>
            </label>

            {!proofScreenshot ? (
              <label
                htmlFor="recharge-proof-screenshot"
                className="group flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--border-light) bg-(--bg-app) px-4 py-6 text-center transition-all hover:border-(--primary) hover:bg-(--primary-soft)/30"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-(--primary-soft) text-(--primary) transition-transform group-hover:scale-105">
                  <ImagePlus className="size-6" />
                </span>
                <span className="text-sm font-medium text-(--text-primary)">
                  ক্লিক করে স্ক্রিনশট আপলোড করুন
                </span>
                <span className="text-xs text-(--text-muted)">
                  PNG, JPG · সর্বোচ্চ 5 MB
                </span>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-(--primary-soft) px-2.5 py-0.5 text-[10px] font-semibold text-(--primary)">
                  <Sparkles className="size-3" />
                  TrxID ও নম্বর স্বয়ংক্রিয়ভাবে পূরণ হবে
                </span>
              </label>
            ) : (
              <div className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-app)">
                <div className="relative">
                  {proofPreviewUrl && (
                    <img
                      src={proofPreviewUrl}
                      alt="পেমেন্ট স্ক্রিনশট প্রিভিউ"
                      className="max-h-64 w-full object-contain"
                    />
                  )}

                  {/* Extracting overlay */}
                  {extracting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="flex items-center gap-2 rounded-md bg-(--bg-surface) px-3 py-2 text-xs font-medium text-(--text-primary) shadow-lg">
                        <Loader2 className="size-3.5 animate-spin text-(--primary)" />
                        তথ্য পড়া হচ্ছে…
                      </div>
                    </div>
                  )}

                  {/* Extracted badge */}
                  {extracted && !extracting && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white shadow">
                      <Check className="size-3" />
                      Details Extracted
                    </span>
                  )}

                  {extractionError && (
                    <p
                      className="mt-1.5 flex items-start gap-1 text-[11px] text-amber-700"
                      aria-live="polite"
                    >
                      ⚠ {extractionError}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-(--border-light) bg-(--bg-surface) px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-(--text-muted)">
                    {proofScreenshot.name}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <label
                      htmlFor="recharge-proof-screenshot"
                      className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-(--primary) transition-colors hover:bg-(--primary-soft)"
                    >
                      Replace
                    </label>
                    {proofScreenshot && (
                      <button
                        type="button"
                        onClick={() => {
                          const current = proofScreenshot
                          void handleScreenshotChange(current)
                        }}
                        disabled={extracting}
                        className="rounded px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-50 disabled:opacity-50"
                      >
                        {extracting ? "Retrying…" : "Retry"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveScreenshot}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            )}

            <input
              id="recharge-proof-screenshot"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) =>
                void handleScreenshotChange(e.currentTarget.files?.[0] ?? null)
              }
            />

            {extracting && (
              <p
                className="mt-1.5 flex items-center gap-1 text-[11px] text-(--primary)"
                aria-live="polite"
              >
                <Loader2 className="size-3 animate-spin" />
                স্ক্রিনশট থেকে TrxID ও অ্যাকাউন্ট নম্বর পড়া হচ্ছে…
              </p>
            )}
            {extracted && !extracting && (
              <p
                className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-600"
                aria-live="polite"
              >
                <Check className="size-3" />
                তথ্য স্বয়ংক্রিয়ভাবে পূরণ হয়েছে — প্রয়োজনে সম্পাদনা করতে
                পারবেন
              </p>
            )}
          </div>

          {/* ── Account / phone (auto-filled, editable) ───── */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-(--text-primary)">
                {method === "qr"
                  ? "যে অ্যাকাউন্ট/নম্বর থেকে পেমেন্ট করেছেন *"
                  : "যে নম্বর থেকে টাকা পাঠিয়েছেন *"}
              </label>
              {extracted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <Sparkles className="size-2.5" />
                  Auto-filled
                </span>
              )}
            </div>
            <input
              type={method === "qr" ? "text" : "tel"}
              value={accountValue}
              onChange={(e) => setAccountValue(e.target.value)}
              placeholder={
                extracting
                  ? "Detecting…"
                  : method === "qr"
                    ? "অ্যাকাউন্টের নাম বা নম্বর"
                    : "01XXXXXXXXX"
              }
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-colors outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
            />
          </div>

          {/* ── Amount (manual) ───────────────────────────── */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-(--text-primary)">
              যত টাকা রিচার্জ করেছেন *
            </label>
            <input
              type="number"
              value={amountValue}
              onChange={(e) => setAmountValue(e.target.value)}
              placeholder="৳ 500"
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 text-sm transition-colors outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
            />
            <div className="mt-2 flex gap-2">
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountValue(String(amt))}
                  className="rounded border border-(--border-light) px-2 py-0.5 text-xs text-(--text-muted) transition-colors hover:bg-(--primary-soft) hover:text-(--primary)"
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* ── TrxID (auto-filled, editable) ─────────────── */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-(--text-primary)">
                TrxID (লেনদেন আইডি) *
              </label>
              {extracted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                  <Sparkles className="size-2.5" />
                  Auto-filled
                </span>
              )}
            </div>
            <input
              type="text"
              value={trxIdValue}
              onChange={(e) => setTrxIdValue(e.target.value.toUpperCase())}
              placeholder={extracting ? "Detecting…" : "যেমন: 9J4K8LMNP"}
              className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 font-mono text-sm tracking-wide transition-colors outline-none focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20"
            />
          </div>
        </div>

        <button className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-(--primary) text-sm font-semibold text-white transition-colors hover:bg-(--primary-hover)">
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
                আপনার মোবাইল ব্যাংকিং অ্যাপ দিয়ে কোডটি স্ক্যান করুন
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
