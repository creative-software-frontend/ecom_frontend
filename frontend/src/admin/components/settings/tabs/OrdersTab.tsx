import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  MapPin,
  Smartphone,
  MessageSquare,
  Globe,
  ShieldCheck,
  Clock,
  Info,
} from "lucide-react"
import type { ReactNode } from "react"
import { SettingsLayout, SettingsCard } from "../SettingsLayout"
import { FormToggle, FormUnitField } from "../SettingsField"
import {
  orderSettingsSchema,
  type OrderSettingsFormValues,
} from "../../../schemas/orderSettingsSchema"
import type { OrderSettings } from "../../../types/settings"

/* ================================================================
   Mock data — replace with API later
   ================================================================ */

const mockOrderSettings: OrderSettings = {
  duplicate_block: { enabled: true, minutes: 15 },
  location_fields: { enabled: true },
  delivery_charges: {
    inside_dhaka: 70,
    outside_dhaka: 120,
    free_delivery_above: 2000,
  },
  mobile_verification: { enabled: false },
  sms_confirmation: { enabled: false },
  vpn_protection: { enabled: false },
  courier_protection: { enabled: false, min_success_ratio: 65 },
}

/* ================================================================
   ComingSoonCard — read-only card for beta features
   Disabled controls won't fire onChange, so dirty state stays clean.
   ================================================================ */

function ComingSoonCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="rounded-lg border border-(--border-light) bg-(--bg-surface) opacity-80">
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-(--bg-table-header) text-(--text-muted)">
            {icon}
          </span>
          <h3 className="truncate text-[13px] font-semibold text-(--text-primary)">
            {title}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-(--bg-table-header) px-2 py-0.5 text-[10px] font-medium text-(--text-muted)">
          Coming soon
        </span>
      </div>
      <div className="space-y-3 px-4 pb-4">
        <p className="text-xs leading-relaxed text-(--text-muted)">
          {description}
        </p>
        {children}
      </div>
    </div>
  )
}

/* ================================================================
   OrdersTab
   ================================================================ */

export default function OrdersTab() {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<OrderSettingsFormValues>({
    resolver: zodResolver(orderSettingsSchema),
    defaultValues: mockOrderSettings,
  })

  // Live toggle state drives conditional content visibility
  const duplicateBlockEnabled = watch("duplicate_block.enabled")
  const locationFieldsEnabled = watch("location_fields.enabled")

  async function onSubmit(data: OrderSettingsFormValues) {
    // TODO: wire to API
    console.log("Save order settings", data)
    await new Promise((r) => setTimeout(r, 400))
    reset(data)
  }

  return (
    <SettingsLayout
      activeTab="orders"
      isDirty={isDirty}
      isSaving={isSubmitting}
      onDiscard={() => reset()}
      onSave={handleSubmit(onSubmit)}
    >
      {/* ---------- Row 1: Duplicate block + Location fields ---------- */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Duplicate order block */}
        <SettingsCard
          title="Duplicate order block"
          description="Stop the same phone number from placing the same order again within a set time."
          badge={
            <Controller
              control={control}
              name="duplicate_block.enabled"
              render={({ field }) => (
                <FormToggle
                  checked={field.value}
                  onChange={field.onChange}
                  aria-label="Enable duplicate order block"
                />
              )}
            />
          }
        >
          {/* Minutes input hidden when disabled but value preserved on toggle back */}
          {duplicateBlockEnabled && (
            <div>
              <FormUnitField
                label="Block time (minutes)"
                type="number"
                leadingSlot={<Clock className="size-4" />}
                trailingSlot="min"
                hint="Default: 15m"
                error={errors.duplicate_block?.minutes?.message}
                {...register("duplicate_block.minutes", {
                  valueAsNumber: true,
                })}
              />
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-(--text-muted)">
                <Info className="mt-0.5 size-3 shrink-0" />
                Repeated checkout with identical phone within this window will
                be flagged as spam.
              </p>
            </div>
          )}
        </SettingsCard>

        {/* Location fields */}
        <SettingsCard
          title="Location fields"
          description="Ask customers for their district and area at checkout."
          badge={
            <Controller
              control={control}
              name="location_fields.enabled"
              render={({ field }) => (
                <FormToggle
                  checked={field.value}
                  onChange={field.onChange}
                  aria-label="Enable location fields"
                />
              )}
            />
          }
        >
          {/* Preview box only shown when toggle is on */}
          {locationFieldsEnabled && (
            <div className="rounded-md border border-(--border-light) bg-(--bg-app) p-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-(--text-primary)">
                <MapPin className="size-3.5 text-primary" />
                Active Administrative Hierarchy
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-[11px] font-medium text-(--text-primary)">
                  Division (বিভাগ)
                </span>
                <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-[11px] font-medium text-(--text-primary)">
                  Zila (জেলা)
                </span>
                <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-[11px] font-medium text-(--text-primary)">
                  Thana (থানা)
                </span>
              </div>
              <p className="mt-2 text-[11px] text-(--text-muted)">
                Division, Zila, and Thana dropdowns enabled in checkout form.
              </p>
            </div>
          )}
        </SettingsCard>
      </div>

      {/* ---------- Delivery charges (wide card) ---------- */}
      <SettingsCard
        title="Delivery charges"
        description="Default shipping rates applied to customer cart based on courier delivery zones."
        badge={
          <span className="rounded-full bg-(--status-delivered-bg) px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-(--status-delivered-text)">
            Automated COD Rate
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FormUnitField
            label="Inside Dhaka"
            type="number"
            leadingSlot="৳"
            help="e.g. Dhanmondi, Gulshan, Mirpur, Uttara"
            error={errors.delivery_charges?.inside_dhaka?.message}
            {...register("delivery_charges.inside_dhaka", {
              valueAsNumber: true,
            })}
          />
          <FormUnitField
            label="Outside Dhaka"
            type="number"
            leadingSlot="৳"
            help="Chittagong, Sylhet, Steadfast / SA Paribahan"
            error={errors.delivery_charges?.outside_dhaka?.message}
            {...register("delivery_charges.outside_dhaka", {
              valueAsNumber: true,
            })}
          />
          <FormUnitField
            label="Free delivery above"
            type="number"
            leadingSlot="৳"
            badge={
              <span className="rounded bg-(--bg-table-header) px-1.5 py-0.5 text-[10px] font-medium text-(--text-muted)">
                Promo rule
              </span>
            }
            help="Orders above ৳2,000 get ৳0 shipping"
            error={errors.delivery_charges?.free_delivery_above?.message}
            {...register("delivery_charges.free_delivery_above", {
              valueAsNumber: true,
            })}
          />
        </div>
      </SettingsCard>

      {/* ---------- Fraud & Verification Shields (beta section) ---------- */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-[14px] font-semibold text-(--text-primary)">
              Fraud & Verification Shields
            </h2>
            <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-[10px] font-semibold tracking-wider text-(--text-muted)">
              BETA ROADMAP
            </span>
          </div>
          <span className="text-[11px] text-(--text-muted)">
            Upcoming automated courier safeguards
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {/* Mobile number verification */}
          <ComingSoonCard
            icon={<Smartphone className="size-4" />}
            title="Mobile number verification"
            description="Send 4-digit OTP via SMS before order confirmation to verify phone authenticity."
          >
            <div className="flex items-end justify-between gap-2">
              <span className="text-[11px] text-(--text-muted)">
                OTP Provider: Greenweb / Banglalink
              </span>
              <FormToggle
                checked={false}
                onChange={() => undefined}
                disabled
                aria-label="Mobile verification (coming soon)"
              />
            </div>
          </ComingSoonCard>

          {/* Order confirmation SMS */}
          <ComingSoonCard
            icon={<MessageSquare className="size-4" />}
            title="Order confirmation SMS"
            description="Automatically dispatch branded confirmation SMS to customer with tracking link upon dispatch."
          >
            <div className="flex items-end justify-between gap-2">
              <span className="text-[11px] text-(--text-muted)">
                Sender ID: POWERZENOX
              </span>
              <FormToggle
                checked={false}
                onChange={() => undefined}
                disabled
                aria-label="SMS confirmation (coming soon)"
              />
            </div>
          </ComingSoonCard>

          {/* VPN protection */}
          <ComingSoonCard
            icon={<Globe className="size-4" />}
            title="VPN protection"
            description="Block checkout requests originating from non-Bangladesh IP addresses and data center VPNs."
          >
            <div className="flex items-end justify-between gap-2">
              <span className="text-[11px] text-(--text-muted)">
                Geo-fence: Bangladesh (.bd) ASN
              </span>
              <FormToggle
                checked={false}
                onChange={() => undefined}
                disabled
                aria-label="VPN protection (coming soon)"
              />
            </div>
          </ComingSoonCard>

          {/* Courier protection — has a disabled read-only input */}
          <ComingSoonCard
            icon={<ShieldCheck className="size-4" />}
            title="Courier protection"
            description="Cross-check customer phone against courier fraud database (Steadfast/Pathao return ratio)."
          >
            {/* Preset to 65 but read-only until feature ships */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-(--text-primary)">
                Minimum success ratio (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={65}
                  readOnly
                  disabled
                  className="block h-9 w-full cursor-not-allowed rounded-md border border-transparent bg-(--bg-app) pr-8 pl-3 text-right text-[13px] text-(--text-muted) tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-(--text-muted)">
                  %
                </span>
              </div>
            </div>
          </ComingSoonCard>
        </div>
      </section>
    </SettingsLayout>
  )
}
