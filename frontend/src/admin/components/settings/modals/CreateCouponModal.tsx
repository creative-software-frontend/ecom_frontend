import { useEffect, useState } from "react"
import {
  useForm,
  Controller,
  useWatch,
  type FieldPath,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
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
import { FieldError, FormSegmentedControl } from "../SettingsField"
import { FormToggleCard } from "../FormToggleCard"
import { InlineNotice } from "../../common/InlineNotice"
import { useEscapeKey } from "../../../hooks/useEscapeKey"
import { ApiError } from "../../../api/client"
import { couponsApi, couponQueryKeys } from "../../../api/couponsApi"
import type {
  Coupon,
  CouponWriteInput,
} from "../../../types/coupon"
import {
  couponFormSchema,
  defaultCouponFormValues,
  generateCouponCode,
  type CouponFormValues,
} from "../../../schemas/couponSchema"

/* ================================================================
   Helpers — safe DOM value -> typed state conversion
   ================================================================ */

// Empty DOM value -> null; otherwise a number, or null when invalid.
const parseNumber = (v: unknown): number | null => {
  if (v === "" || v === null || v === undefined) return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

// Empty DOM string -> 0 so the number schema can validate cleanly.
const toNumberOrZero = (v: unknown): number => parseNumber(v) ?? 0

// Empty DOM string -> null for nullable numeric fields (usage limit).
const toNumberOrNull = (v: unknown): number | null => parseNumber(v)

// Empty DOM string -> null for nullable text/date fields.
const toNullableString = (v: unknown): string | null => {
  if (typeof v !== "string" || v === "") return null
  return v
}

// Backend treats naive datetime-local strings as Asia/Dhaka (UTC+6).
// Convert stored ISO timestamps back to the same wall-clock time for editing.
function toDateTimeLocal(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getTime() + 6 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 16)
}

function isExpiryInPast(value: string): boolean {
  const normalized =
    value.length === 10 ? `${value}T23:59:59.999+06:00` : `${value}+06:00`
  const date = new Date(normalized)
  return !Number.isNaN(date.getTime()) && date <= new Date()
}

function couponToFormValues(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    discount_type: coupon.discountType,
    discount_value: coupon.discountValue,
    note: coupon.note,
    max_discount: {
      enabled: coupon.maxDiscountValue !== null,
      value: coupon.maxDiscountValue ?? 500,
    },
    min_purchase: {
      enabled: coupon.minPurchaseValue !== null,
      value: coupon.minPurchaseValue ?? 1500,
    },
    usage_limit: coupon.usageLimit,
    expires_at: toDateTimeLocal(coupon.expiresAt),
    active: coupon.status === "active",
  }
}

function toWriteInput(
  values: CouponFormValues,
  editing?: Coupon | null
): CouponWriteInput {
  const note = values.note?.trim() ?? ""
  const input: CouponWriteInput = {
    code: values.code.trim().toUpperCase(),
    discountType: values.discount_type,
    discountValue: values.discount_value,
    note: note || null,
    usageLimit: values.usage_limit,
    maxDiscountValue: values.max_discount.enabled
      ? values.max_discount.value
      : null,
    minPurchaseValue: values.min_purchase.enabled
      ? values.min_purchase.value
      : null,
    expiresAt: values.expires_at,
  }

  // An expired coupon with a still-past expiry stays expired unless the user
  // explicitly asks to activate it — then the backend returns a helpful 422.
  if (
    editing?.status === "expired" &&
    values.expires_at &&
    isExpiryInPast(values.expires_at) &&
    !values.active
  ) {
    return input
  }

  return { ...input, status: values.active ? "active" : "paused" }
}

// Backend field names -> react-hook-form paths.
const serverErrorPaths: Record<string, FieldPath<CouponFormValues>> = {
  code: "code",
  discountType: "discount_type",
  discountValue: "discount_value",
  note: "note",
  usageLimit: "usage_limit",
  maxDiscountValue: "max_discount.value",
  minPurchaseValue: "min_purchase.value",
  expiresAt: "expires_at",
  status: "active",
}

/* ================================================================
   CreateCouponModal — create + edit
   ================================================================ */

type CreateCouponModalProps = {
  open: boolean
  onClose: () => void
  coupon?: Coupon | null
  onSaved?: (coupon: Coupon) => void
}

export function CreateCouponModal({
  open,
  onClose,
  coupon,
  onSaved,
}: CreateCouponModalProps) {
  const queryClient = useQueryClient()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: defaultCouponFormValues,
  })

  // Watch the type so the prefix/suffix and max attribute switch dynamically.
  const discountType = useWatch({ name: "discount_type", control })

  const mutation = useMutation({
    mutationFn: (input: CouponWriteInput) =>
      coupon ? couponsApi.update(coupon.id, input) : couponsApi.create(input),
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: couponQueryKeys.all })
      setFormError(null)
      onSaved?.(saved)
      onClose()
    },
    onError: (error) => {
      if (error instanceof ApiError && error.fieldErrors) {
        let mapped = false
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          const path = serverErrorPaths[field]
          if (path) {
            setError(path, { type: "server", message })
            mapped = true
          }
        }
        setFormError(mapped ? null : error.message)
        return
      }
      setFormError(
        error instanceof Error ? error.message : "Could not save the coupon"
      )
    },
  })

  // Reset the form to the current coupon (or create defaults) on every open.
  useEffect(() => {
    if (!open) return
    reset(coupon ? couponToFormValues(coupon) : defaultCouponFormValues)
    setFormError(null)
  }, [open, coupon, reset])

  useEscapeKey(onClose, open && !mutation.isPending)

  // Prevent body scroll while the modal is open.
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

  const onSubmit = (values: CouponFormValues) => {
    setFormError(null)
    mutation.mutate(toWriteInput(values, coupon))
  }

  const isEditing = Boolean(coupon)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="coupon-modal-title"
      onMouseDown={() => {
        if (!mutation.isPending) onClose()
      }}
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/40 p-4 duration-150 fade-in"
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-2xl animate-in flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl duration-150 zoom-in-95 fade-in"
      >
        {/* ---------- Header ---------- */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-primary">
              <Ticket className="size-4" />
            </span>
            <h2
              id="coupon-modal-title"
              className="text-base font-semibold text-(--text-primary)"
            >
              {isEditing ? "Edit coupon" : "Create coupon"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            aria-label="Close"
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"
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
            {formError && (
              <InlineNotice
                variant="error"
                message={formError}
                onDismiss={() => setFormError(null)}
                dismissLabel="Dismiss error"
                className="flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-3 py-2 text-xs text-(--status-cancelled-text)"
                dismissClassName="rounded px-1 text-(--status-cancelled-text) hover:bg-(--bg-surface-hover)"
                ariaLive="assertive"
              />
            )}

            {/* Coupon code + Generate */}
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="coupon-code"
                  className="text-sm font-semibold text-(--text-primary)"
                >
                  Coupon code
                </label>
                <span className="text-xs text-(--text-muted)">
                  Customers enter this at checkout
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  id="coupon-code"
                  type="text"
                  placeholder="SUMMER25"
                  maxLength={32}
                  autoComplete="off"
                  className="h-9 min-w-0 flex-1 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 font-mono text-sm tracking-wide text-(--text-primary) uppercase transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  {...register("code")}
                />
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                >
                  <RefreshCw className="size-3.5" />
                  Generate
                </button>
              </div>
              {errors.code && <FieldError>{errors.code.message}</FieldError>}
            </div>

            {/* Discount type */}
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-(--text-primary)">
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
                className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
              >
                Discount value
              </label>
              <div className="relative">
                {discountType === "amount" && (
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-(--text-muted)">
                    ৳
                  </span>
                )}
                <input
                  id="discount-value"
                  type="number"
                  min={1}
                  max={discountType === "percentage" ? 100 : undefined}
                  className={`h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-8 text-right text-sm text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20 ${
                    discountType === "amount" ? "pl-8" : "pl-3"
                  }`}
                  {...register("discount_value", {
                    setValueAs: toNumberOrZero,
                  })}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-(--text-muted)">
                  {discountType === "percentage" ? "%" : "৳"}
                </span>
              </div>
              {errors.discount_value && (
                <FieldError>{errors.discount_value.message}</FieldError>
              )}
            </div>

            {/* Note */}
            <div>
              <label
                htmlFor="coupon-note"
                className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
              >
                Note <span className="text-(--text-muted)">(optional)</span>
              </label>
              <input
                id="coupon-note"
                type="text"
                maxLength={120}
                placeholder="e.g. Free Delivery"
                className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                {...register("note", { setValueAs: toNullableString })}
              />
              {errors.note && <FieldError>{errors.note.message}</FieldError>}
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
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-(--text-muted)">
                        ৳
                      </span>
                      <input
                        id="max-discount-value"
                        type="number"
                        min={1}
                        placeholder="500"
                        className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-right text-sm text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
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
                      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-(--text-muted)">
                        ৳
                      </span>
                      <input
                        id="min-purchase-value"
                        type="number"
                        min={1}
                        placeholder="1,500"
                        className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) pr-3 pl-8 text-right text-sm text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
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
                  className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
                >
                  Total usage limit
                </label>
                <input
                  id="usage-limit"
                  type="number"
                  min={1}
                  placeholder="Leave empty for unlimited"
                  className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm text-(--text-primary) tabular-nums transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
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
                  className="mb-1.5 block text-sm font-semibold text-(--text-primary)"
                >
                  Expiry date &amp; time
                </label>
                <div className="relative">
                  <input
                    id="expires-at"
                    type="datetime-local"
                    onClick={(e) => e.currentTarget.showPicker()}
                    className="h-9 w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 pr-9 text-sm text-(--text-primary) scheme-light transition-all outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20 [&::-webkit-calendar-picker-indicator]:hidden"
                    {...register("expires_at", {
                      setValueAs: toNullableString,
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
                  description={
                    isEditing
                      ? "Keep this coupon available after saving"
                      : "Enable this coupon immediately upon creation"
                  }
                  checked={field.value}
                  onChange={field.onChange}
                  variant="success"
                  icon={<BadgeCheck className="size-4" />}
                />
              )}
            />
          </div>

          {/* ---------- Footer ---------- */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-(--border-light) bg-(--bg-surface) px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center rounded-md border border-(--border-light) bg-(--bg-surface) px-4 text-sm font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover) disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="size-3.5" />
              {mutation.isPending
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Create coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
