import { useState } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Shield,
  Share2,
  TrendingUp,
  ExternalLink,
  Info,
  Lock,
  BadgeCheck,
  FlaskConical,
} from "lucide-react"
import { SettingsLayout } from "../SettingsLayout"
import { FormToggle, FieldError } from "../SettingsField"
import { CopyableField } from "../CopyableField"
import { MaskedTokenField } from "../MaskedTokenField"
import {
  marketingSchema,
  defaultMarketingValues,
  type MarketingFormValues,
} from "../../../schemas/marketingSchema"
import type { MarketingSettings } from "../../../types/settings"

/* ================================================================
   Mock — server state for tokens.
   Real API sends: `token_saved`, `token_updated_at` (never the token).
   ================================================================ */

const mockServerState: MarketingSettings = {
  facebook: {
    enabled: true,
    pixel_id: "849201948201940",
    test_event_code: "TEST84920",
    token_saved: true,
    token_updated_at: "2026-10-12T00:00:00.000Z",
  },
  tiktok: {
    enabled: true,
    pixel_id: "CTR9824X82901P",
    token_saved: true,
    token_updated_at: "2026-09-04T00:00:00.000Z",
  },
}

/* ================================================================
   Sub-components
   ================================================================ */

// Status chip that flips between Active/Inactive with the toggle.
function StatusChip({ active, note }: { active: boolean; note?: string }) {
  if (!active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-(--bg-table-header) px-2 py-0.5 text-[11px] font-medium text-(--text-muted)">
        <span className="size-1.5 rounded-full bg-(--text-muted)" />
        Inactive
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-(--status-delivered-bg) px-2 py-0.5 text-[11px] font-medium text-(--status-delivered-text)">
      <span className="size-1.5 rounded-full bg-(--status-delivered-text)" />
      Active{note ? ` (${note})` : ""}
    </span>
  )
}

// Shared integration header: icon + title + status + external link + toggle.
function IntegrationHeader({
  iconBg,
  icon,
  title,
  description,
  statusActive,
  statusNote,
  externalLabel,
  externalHref,
  enabled,
  onToggle,
}: {
  iconBg: string
  icon: React.ReactNode
  title: string
  description: string
  statusActive: boolean
  statusNote?: string
  externalLabel: string
  externalHref: string
  enabled: boolean
  onToggle: (next: boolean) => void
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-1 items-start gap-3">
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-md ${iconBg}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-(--text-primary)">
              {title}
            </h2>
            <StatusChip active={statusActive} note={statusNote} />
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-(--text-muted)">
            {description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <a
          href={externalHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-(--text-muted) transition-colors hover:text-primary"
        >
          {externalLabel}
          <ExternalLink className="size-3" />
        </a>
        <FormToggle checked={enabled} onChange={onToggle} />
      </div>
    </div>
  )
}

/* ================================================================
   MarketingTab
   ================================================================ */

export default function MarketingTab() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MarketingFormValues>({
    resolver: zodResolver(marketingSchema),
    defaultValues: defaultMarketingValues,
  })

  // Per-field "replace token" editing flags — UI-only state, not part of form.
  const [editingFbToken, setEditingFbToken] = useState(false)
  const [editingTtToken, setEditingTtToken] = useState(false)

  // Watch enabled flags so the header chip and tab badge stay in sync.
  const fbEnabled = useWatch({ control, name: "facebook.enabled" })
  const ttEnabled = useWatch({ control, name: "tiktok.enabled" })
  const activeCount = Number(fbEnabled) + Number(ttEnabled)

  async function onSubmit(data: MarketingFormValues) {
    // TODO: wire to API — only send token_input if non-empty (means replace).
    // Backend behaviour: empty token_input = keep existing token.
    console.log("Save marketing", data)
    await new Promise((r) => setTimeout(r, 400))
    reset(data)
    setEditingFbToken(false)
    setEditingTtToken(false)
  }

  function handleDiscard() {
    reset()
    setEditingFbToken(false)
    setEditingTtToken(false)
  }

  return (
    <SettingsLayout
      activeTab="marketing"
      badges={{ marketing: activeCount }}
      isDirty={isDirty}
      isSaving={isSubmitting}
      onDiscard={handleDiscard}
      onSave={handleSubmit(onSubmit)}
    >
      {/* ---------- Restricted access banner ---------- */}
      <div className="rounded-lg border border-(--border-light) bg-(--bg-surface-hover) p-4">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-white">
            <Shield className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Restricted Access &amp; Script Injection Notice
              </h2>
              <span className="rounded-full bg-(--bg-surface) px-2 py-0.5 text-[11px] font-medium text-(--text-muted)">
                Admin Clearance Only
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-(--text-muted)">
              Tracking pixels inject low-latency measurement scripts directly
              into customer storefront pages to dispatch server-side telemetry
              and track campaign performance. Tokens operate in high-privilege
              context.
            </p>
          </div>
        </div>
      </div>

      {/* ---------- Facebook Pixel & CAPI ---------- */}
      <section className="space-y-4 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
        <Controller
          control={control}
          name="facebook.enabled"
          render={({ field }) => (
            <IntegrationHeader
              iconBg="bg-blue-50 text-blue-600"
              icon={<Share2 className="size-4" />}
              title="Facebook Pixel & Conversions API"
              description="Track purchases, add-to-carts, and optimize Meta ad campaigns via browser pixel and server CAPI redundancy."
              statusActive={field.value}
              statusNote="Browser + CAPI"
              externalLabel="Meta Events Manager"
              externalHref="https://business.facebook.com/events_manager"
              enabled={field.value}
              onToggle={field.onChange}
            />
          )}
        />

        <div className="space-y-3 rounded-md bg-(--bg-surface-hover) p-3">
          {/* Pixel ID + Test Event Code row */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Controller
              control={control}
              name="facebook.pixel_id"
              render={({ field }) => (
                <CopyableField
                  label="Pixel ID"
                  value={field.value}
                  hint="Dataset ID"
                />
              )}
            />
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="fb-test-event"
                  className="text-[11px] font-semibold tracking-wider text-(--text-muted) uppercase"
                >
                  Test event code{" "}
                  <span className="font-normal text-(--text-muted)">
                    (optional)
                  </span>
                </label>
                <span className="shrink-0 text-[11px] font-medium text-amber-600">
                  Clear before live campaigns
                </span>
              </div>
              <div className="flex h-9 items-center rounded-md border border-(--border-light) bg-(--bg-surface) pr-2 pl-3">
                <FlaskConical className="mr-2 size-3.5 shrink-0 text-(--text-muted)" />
                <input
                  id="fb-test-event"
                  type="text"
                  placeholder="TEST84920"
                  className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-(--text-primary) outline-none"
                  {...register("facebook.test_event_code")}
                />
              </div>
              {errors.facebook?.test_event_code && (
                <FieldError>
                  {errors.facebook.test_event_code.message}
                </FieldError>
              )}
            </div>
          </div>

          {/* Token field */}
          <MaskedTokenField
            id="fb-token"
            label="Conversions API Access Token"
            saved={mockServerState.facebook.token_saved}
            savedAt={mockServerState.facebook.token_updated_at}
            editing={editingFbToken}
            onReplace={() => setEditingFbToken(true)}
            onCancel={() => setEditingFbToken(false)}
            register={register("facebook.token_input")}
            error={errors.facebook?.token_input?.message}
          />
        </div>
      </section>

      {/* ---------- TikTok Pixel & Events API ---------- */}
      <section className="space-y-4 rounded-lg border border-(--border-light) bg-(--bg-surface) p-4">
        <Controller
          control={control}
          name="tiktok.enabled"
          render={({ field }) => (
            <IntegrationHeader
              iconBg="bg-fuchsia-50 text-fuchsia-600"
              icon={<TrendingUp className="size-4" />}
              title="TikTok Pixel & Events API"
              description="Measure TikTok advertising conversions, sync catalog engagements, and optimize checkout funnel events."
              statusActive={field.value}
              externalLabel="TikTok Ads Manager"
              externalHref="https://ads.tiktok.com/i18n/dashboard"
              enabled={field.value}
              onToggle={field.onChange}
            />
          )}
        />

        <div className="space-y-3 rounded-md bg-(--bg-surface-hover) p-3">
          <Controller
            control={control}
            name="tiktok.pixel_id"
            render={({ field }) => (
              <CopyableField
                label="Pixel ID"
                value={field.value}
                hint="TikTok Web Pixel ID"
              />
            )}
          />

          <MaskedTokenField
            id="tt-token"
            label="Events API Access Token"
            saved={mockServerState.tiktok.token_saved}
            savedAt={mockServerState.tiktok.token_updated_at}
            editing={editingTtToken}
            onReplace={() => setEditingTtToken(true)}
            onCancel={() => setEditingTtToken(false)}
            register={register("tiktok.token_input")}
            error={errors.tiktok?.token_input?.message}
          />
        </div>
      </section>

      {/* ---------- Encryption footer banner ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-(--border-light) bg-(--bg-surface-hover) px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-(--text-muted)">
          <Lock className="size-3.5 shrink-0" />
          <span>
            Tokens are stored securely using field-level encryption and are
            never shown again in plain text.
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-(--text-muted)">
          <BadgeCheck className="size-3.5" />
          TLS 1.3 Strict
        </span>
      </div>

      {/* Info note about token semantics (only shown when no token saved yet) */}
      {!mockServerState.facebook.token_saved && (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            No Facebook token saved yet. Paste a token to enable the Conversions
            API.
          </span>
        </div>
      )}
    </SettingsLayout>
  )
}
