import { useEffect } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  X,
  Ticket,
  RefreshCw,
  Percent,
  Banknote,
  Calendar,
  BadgeCheck,
  Check,
} from "lucide-react"
import { FieldError } from "../SettingsField"
import { FormSegmentedControl } from "../SettingsField"
import { FormToggleCard } from "../FormToggleCard"
import {
  couponFormSchema,
  defaultCouponFormValues,
  generateCouponCode,
  type CouponFormValues,
} from "../../../schemas/couponSchema"

/* ================================================================
   Helpers — safe DOM value -> typed state conversion
   ================================================================ */

// Empty DOM string -> 0 so the number schema can validate cleanly.
const toNumberOrZero = (v: unknown): number => {
  if (v === "" || v === null || v === undefined) return 0
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

// Empty DOM string -> null for nullable numeric fields (usage limit).
const toNumberOrNull = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// Empty DOM string -> null for nullable date string.
const toDateOrNull = (v: unknown): string | null => {
  if (typeof v !== "string" || v === "") return null
  return v
}

/* ================================================================
   CreateCouponModal
   ================================================================ */

type CreateCouponModalProps = {
  open: boolean
  onClose: () => void
  onCreated?: (coupon: CouponFormValues) => void
}

export function CreateCouponModal({
  open,
  onClose,
  onCreated,
}: CreateCouponModalProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: defaultCouponFormValues,
  })

  // Watch toggle and type so we can switch UI branches dynamically.
  const discountType = useWatch({ name: "discount_type", control })
  // const maxDiscountEnabled = useWatch({ name: "max_discount.enabled", control })
  // const minPurchaseEnabled = useWatch({ name: "min_purchase.enabled", control })

  // Reset form every time the modal is closed -> next open starts fresh.
  useEffect(() => {
    if (!open) reset(defaultCouponFormValues)
  }, [open, reset])

  // Escape key closes modal.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onClose])

  // Prevent body scroll while modal is open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const handleGenerate = () => {
    setValue("code", generateCouponCode(), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const onSubmit = async (values: CouponFormValues) => {
    // TODO: wire to API — POST /api/admin/coupons
    const normalized: CouponFormValues = {
      ...values,
      code: values.code.toUpperCase(),
    }
    await new Promise((r) => setTimeout(r, 400))
    onCreated?.(normalized)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-coupon-title"
      onMouseDown={onClose}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 duration-150 fade-in"
    >
      <div
        // onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}

        className="flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface) shadow-xl duration-150 zoom-in-95 fade-in"
      >
        {/* ---------- Header ---------- */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <Ticket className="size-4" />
            </span>
            <h2
              id="create-coupon-title"
              className="text-base font-semibold text-(--text-primary)"
            >
              Create coupon
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ---------- Form ---------- */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {/* Coupon code + Generate */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="coupon-code"
                  className="text-[13px] font-semibold text-(--text-primary)"
                >
                  Coupon code
                </label>
                <span className="text-[11px] text-(--text-muted)">
                  Customers enter this at checkout
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="SUMMER25"
                  maxLength={20}
                  autoComplete="off"
                  className="h-9 min-w-0 flex-1 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 font-mono text-[13px] tracking-wide text-(--text-primary) uppercase transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  {...register("code")}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <RefreshCw className="size-3.5" />
                  Generate
                </button>
              </div>
              {errors.code && <FieldError>{errors.code.message}</FieldError>}
            </div>

            {/* Discount type */}
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-(--text-primary)">
                Discount type
              </label>
              <Controller
                control={control}
                name="discount_type"
                render={({ field }) => (
                  <FormSegmentedControl
                    aria-label="Discount type"
                    options={[
                      {
                        value: "percentage",
                        label: "Percentage",
                        icon: <Percent className="size-3.5" />,
                      },
                      {
                        value: "amount",
                        label: "Fixed Amount (৳)",
                        icon: <Banknote className="size-3.5" />,
                      },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Discount value */}
            <div>
              <label
                htmlFor="discount-value"
                className="mb-1.5 block text-[13px] font-semibold text-(--text-primary)"
              >
                Discount value
              </label>
              <div className="relative">
                {discountType === "amount" && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-(--text-muted)">
                    ৳
                  </span>
                )}
                <input
                  id="discount-value"
                  type="number"
                  min={1}
                  max={discountType === "percentage" ? 100 : undefined}
                  className={`h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-8 text-right text-[13px] text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20 ${
                    discountType === "amount" ? "pl-8" : "pl-3"
                  }`}
                  {...register("discount_value", {
                    setValueAs: toNumberOrZero,
                  })}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[13px] text-(--text-muted)">
                  {discountType === "percentage" ? "%" : "৳"}
                </span>
              </div>
              {errors.discount_value && (
                <FieldError>{errors.discount_value.message}</FieldError>
              )}
            </div>

            {/* Max discount cap */}
            <Controller
              control={control}
              name="max_discount.enabled"
              render={({ field: toggle }) => (
                <FormToggleCard
                  title="Maximum discount cap"
                  description="Restrict discount ceiling on large cart values"
                  checked={toggle.value}
                  onChange={toggle.onChange}
                >
                  <div>
                    <label
                      htmlFor="max-discount-value"
                      className="mb-1.5 block text-xs font-medium text-(--text-primary)"
                    >
                      Maximum discount amount (৳)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-(--text-muted)">
                        ৳
                      </span>
                      <input
                        id="max-discount-value"
                        type="number"
                        min={1}
                        placeholder="500"
                        className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-right text-[13px] text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                        {...register("max_discount.value", {
                          setValueAs: toNumberOrZero,
                        })}
                      />
                    </div>
                    {errors.max_discount?.value && (
                      <FieldError>
                        {errors.max_discount.value.message}
                      </FieldError>
                    )}
                  </div>
                </FormToggleCard>
              )}
            />

            {/* Minimum purchase */}
            <Controller
              control={control}
              name="min_purchase.enabled"
              render={({ field: toggle }) => (
                <FormToggleCard
                  title="Minimum purchase requirement"
                  description="Cart subtotal threshold required for eligibility"
                  checked={toggle.value}
                  onChange={toggle.onChange}
                >
                  <div>
                    <label
                      htmlFor="min-purchase-value"
                      className="mb-1.5 block text-xs font-medium text-(--text-primary)"
                    >
                      Minimum order subtotal (৳)
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-(--text-muted)">
                        ৳
                      </span>
                      <input
                        id="min-purchase-value"
                        type="number"
                        min={1}
                        placeholder="1,500"
                        className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-right text-[13px] text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                        {...register("min_purchase.value", {
                          setValueAs: toNumberOrZero,
                        })}
                      />
                    </div>
                    {errors.min_purchase?.value && (
                      <FieldError>
                        {errors.min_purchase.value.message}
                      </FieldError>
                    )}
                  </div>
                </FormToggleCard>
              )}
            />

            {/* Usage limit + Expiry */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="usage-limit"
                  className="mb-1.5 block text-[13px] font-semibold text-(--text-primary)"
                >
                  Total usage limit
                </label>
                <input
                  id="usage-limit"
                  type="number"
                  min={1}
                  placeholder="Leave empty for unlimited"
                  className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[13px] text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  {...register("usage_limit", {
                    setValueAs: toNumberOrNull,
                  })}
                />
                {errors.usage_limit && (
                  <FieldError>{errors.usage_limit.message}</FieldError>
                )}
              </div>
              <div>
                <label
                  htmlFor="expires-at"
                  className="mb-1.5 block text-[13px] font-semibold text-(--text-primary)"
                >
                  Expiry date &amp; time
                </label>
                <div className="relative">
                  <input
                    id="expires-at"
                    type="datetime-local"
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 pr-9 text-[13px] text-(--text-primary) scheme-light transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20 [&::-webkit-calendar-picker-indicator]:hidden"
                    {...register("expires_at", {
                      setValueAs: toDateOrNull,
                    })}
                  />

                  <label htmlFor="expires-at">
                    <Calendar className="absolute top-1/2 right-3 size-4 -translate-y-1/2 cursor-pointer text-(--text-muted)" />
                  </label>
                </div>
                {errors.expires_at && (
                  <FieldError>{errors.expires_at.message}</FieldError>
                )}
              </div>
            </div>

            {/* Active status */}
            <Controller
              control={control}
              name="active"
              render={({ field }) => (
                <FormToggleCard
                  title="Active status"
                  description="Enable this coupon immediately upon creation"
                  checked={field.value}
                  onChange={field.onChange}
                  variant="success"
                  icon={<BadgeCheck className="size-4" />}
                />
              )}
            />

            {/* Hidden debug for unused watch vars — keep TS happy on strict */
            /* (Remove once toggle-gated content starts using these directly) */}
            {/* {maxDiscountEnabled === null && null}
            {minPurchaseEnabled === null && null} */}
          </div>

          {/* ---------- Footer ---------- */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-(--border-light) bg-(--bg-surface) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-[13px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-[13px] font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {isSubmitting ? "Creating..." : "Create coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
