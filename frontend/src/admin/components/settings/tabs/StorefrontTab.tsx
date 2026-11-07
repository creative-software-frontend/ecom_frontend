import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  GripVertical,
  Trash2,
  Link as LinkIcon,
  ImagePlus,
  Megaphone,
  AlertTriangle,
  Truck,
  ShoppingCart,
} from "lucide-react"
import { SettingsLayout, SettingsCard } from "../SettingsLayout"
import { SortableList } from "../SortableList"
import { FormToggle, FormColorPicker, FieldError } from "../SettingsField"
import {
  storefrontSchema,
  type StorefrontFormValues,
} from "../../../schemas/storefrontSchema"
import type { StorefrontSettings } from "../../../types/settings"

/* ================================================================
   Mock data — replace with API later
   ================================================================ */

const mockStorefront: StorefrontSettings = {
  announcement: {
    enabled: true,
    marquee_text:
      "🔥 Free home delivery all over Bangladesh on orders above ৳2,000! Cash on delivery available. Hot Herbal extracts in stock now!",
    order_note:
      "⚠️ Please provide your active WhatsApp or mobile number for instant delivery verification.",
  },
  banners: [
    {
      id: "b1",
      image: null,
      alt: "Ultra Hot Herbal Release",
      link: "https://powerzenox.com/products/ultra-hot",
      active: true,
    },
    {
      id: "b2",
      image: null,
      alt: "Winter Vitality Bundle Deal",
      link: "https://powerzenox.com/offers/winter-bundle",
      active: true,
    },
  ],
  brand_colors: {
    primary: "#0D9488",
    background: "#FAF8FF",
  },
}

/* ================================================================
   BannerThumb — image preview with dimension badge
   ================================================================ */

function BannerThumb({ src, alt }: { src: string | null; alt: string }) {
  return (
    <div className="relative aspect-8/3 w-full overflow-hidden rounded-md border border-(--border-light) bg-(--bg-table-header) md:w-32">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-[10px] font-medium text-(--text-muted)">
          No image
        </div>
      )}
      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white tabular-nums">
        1600 × 600
      </span>
    </div>
  )
}

/* ================================================================
   Storefront Tab
   ================================================================ */

export default function StorefrontTab() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(storefrontSchema),
    defaultValues: mockStorefront,
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "banners",
  })

  const marqueeText = watch("announcement.marquee_text") ?? ""
  const orderNote = watch("announcement.order_note") ?? ""
  const announcementEnabled = watch("announcement.enabled")
  const brandPrimary = watch("brand_colors.primary")
  const brandBackground = watch("brand_colors.background")

  const marqueeDisplay =
    marqueeText || "Your announcement text will appear here…"

  async function onSubmit(data: StorefrontFormValues) {
    // TODO: wire to API later
    console.log("Save storefront", data)
    await new Promise((r) => setTimeout(r, 400))
    reset(data)
  }

  return (
    <SettingsLayout
      activeTab="storefront"
      isDirty={isDirty}
      isSaving={isSubmitting}
      onDiscard={() => reset()}
      onSave={handleSubmit(onSubmit)}
    >
      {/* ---------------- Announcement bar ---------------- */}
      <SettingsCard
        title="Announcement bar"
        description="Top notification banner displayed above the header on all storefront pages."
        badge={
          <Controller
            control={control}
            name="announcement.enabled"
            render={({ field }) => (
              <FormToggle
                checked={field.value}
                onChange={field.onChange}
                aria-label="Show announcement bar"
              />
            )}
          />
        }
      >
        {/* Marquee text */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="marquee"
              className="text-xs font-semibold text-(--text-primary)"
            >
              Marquee text
            </label>
            <span className="text-xs text-(--text-muted)">
              Supports emojis and Bengali
            </span>
          </div>
          <textarea
            id="marquee"
            rows={2}
            maxLength={200}
            placeholder="Write a short announcement…"
            className="block w-full resize-y rounded-md border border-transparent bg-(--bg-app) px-3 py-2 text-[13px] text-(--text-primary) transition-all outline-none hover:border-(--border-hover) focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
            aria-invalid={Boolean(errors.announcement?.marquee_text)}
            {...register("announcement.marquee_text")}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-(--text-muted)">
            <span>
              {errors.announcement?.marquee_text?.message ? (
                <FieldError>
                  {errors.announcement.marquee_text.message}
                </FieldError>
              ) : (
                "Tip: keep under 120 characters for mobile"
              )}
            </span>
            <span className="tabular-nums">{marqueeText.length}/200</span>
          </div>
        </div>

        {/* Live preview — seamless marquee loop */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
              Live store preview
            </span>
            <span className="flex items-center gap-1 text-xs text-(--text-muted)">
              <Megaphone className="size-3" />
              Real-time rendered
            </span>
          </div>
          <div
            className={`flex items-center gap-2 overflow-hidden rounded-md px-3 py-2 text-xs font-medium text-white transition-opacity ${
              announcementEnabled
                ? "bg-primary"
                : "bg-(--text-muted) opacity-40"
            }`}
          >
            <div className="min-w-0 flex-1 overflow-hidden">
              <span className="admin-marquee">
                <span className="pr-16">{marqueeDisplay}</span>
                <span className="pr-16" aria-hidden="true">
                  {marqueeDisplay}
                </span>
              </span>
            </div>
            <span className="ml-auto shrink-0 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold">
              BD COD
            </span>
          </div>
        </div>

        {/* Order note */}
        <div>
          <label
            htmlFor="order-note"
            className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
          >
            Order note
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-amber-500">
              <AlertTriangle className="size-4" />
            </span>
            <input
              id="order-note"
              type="text"
              maxLength={160}
              placeholder="Shown above the checkout order form"
              className="block h-9 w-full rounded-md border border-transparent bg-(--bg-app) pr-3 pl-9 text-[13px] text-(--text-primary) transition-all outline-none hover:border-(--border-hover) focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
              {...register("announcement.order_note")}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-(--text-muted)">
            <span>
              Shown to customers directly above the checkout order confirmation
              form.
            </span>
            <span className="shrink-0 tabular-nums">
              {orderNote.length}/160
            </span>
          </div>
        </div>
      </SettingsCard>

      {/* ---------------- Banners ---------------- */}
      <SettingsCard
        title="Banners"
        description="Hero carousel banners on the homepage. Drag to reorder. Recommended size 1600 × 600."
        badge={
          <span className="rounded-full bg-(--bg-table-header) px-2.5 py-1 text-xs font-medium text-(--text-muted)">
            {fields.length} {fields.length === 1 ? "banner" : "banners"}
          </span>
        }
      >
        {fields.length > 0 && (
          <SortableList
            items={fields}
            onReorder={(oldIndex, newIndex) => move(oldIndex, newIndex)}
          >
            {(
              _field,
              index,
              { attributes, listeners, setActivatorNodeRef }
            ) => {
              const bannerValue = watch(`banners.${index}`)
              const linkError = errors.banners?.[index]?.link?.message

              return (
                <div className="mb-3 flex flex-col gap-3 rounded-md border border-(--border-light) bg-(--bg-app) p-3 md:flex-row md:items-start">
                  {/* Single drag handle — position via CSS only */}
                  <button
                    type="button"
                    ref={setActivatorNodeRef}
                    {...attributes}
                    {...listeners}
                    className="cursor-grab touch-none self-start text-(--text-muted) transition-colors hover:text-(--text-primary) active:cursor-grabbing md:mt-1"
                    aria-label={`Drag to reorder banner ${index + 1}`}
                  >
                    <GripVertical className="size-4" />
                  </button>

                  {/* Image */}
                  <div className="w-full md:w-32 md:shrink-0">
                    <BannerThumb
                      src={bannerValue?.image ?? null}
                      alt={bannerValue?.alt || `Banner ${index + 1}`}
                    />
                  </div>

                  {/* Info column */}
                  <div className="min-w-0 flex-1 space-y-2">
                    {/* Title + remove */}
                    <div className="flex items-start gap-2">
                      <span className="flex-1 truncate text-[13px] font-semibold text-(--text-primary)">
                        Banner #{index + 1}
                        {bannerValue?.alt ? ` • ${bannerValue.alt}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="shrink-0 rounded p-1 text-(--text-muted) transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label={`Remove banner ${index + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    {/* Link + active toggle */}
                    <div className="flex items-center gap-2">
                      {/* Inline link input — no empty label spacing */}
                      <div className="min-w-0 flex-1">
                        <div className="relative">
                          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-(--text-muted)">
                            <LinkIcon className="size-4" />
                          </span>
                          <input
                            type="url"
                            placeholder="https://example.com"
                            className="block h-9 w-full rounded-md border border-transparent bg-(--bg-app) pr-3 pl-9 text-[13px] text-(--text-primary) transition-all outline-none hover:border-(--border-hover) focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                            aria-invalid={Boolean(linkError)}
                            aria-label={`Banner ${index + 1} link`}
                            {...register(`banners.${index}.link`)}
                          />
                        </div>
                        {linkError && <FieldError>{linkError}</FieldError>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs font-medium text-(--text-muted)">
                          Active
                        </span>
                        <Controller
                          control={control}
                          name={`banners.${index}.active`}
                          render={({ field: f }) => (
                            <FormToggle
                              checked={f.value ?? true}
                              onChange={f.onChange}
                              aria-label={`Banner ${index + 1} active`}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            }}
          </SortableList>
        )}

        {/* Add banner */}
        <button
          type="button"
          onClick={() =>
            append({
              id: `b${Date.now()}`,
              image: null,
              alt: "",
              link: "",
              active: true,
            })
          }
          className="flex w-full flex-col items-center gap-1 rounded-md border-2 border-dashed border-(--border-light) bg-(--bg-surface) px-4 py-6 text-center transition-colors hover:border-(--primary)/40 hover:bg-(--bg-surface-hover)"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-(--bg-table-header) text-primary">
            <ImagePlus className="size-4" />
          </span>
          <span className="text-[13px] font-medium text-(--text-primary)">
            Upload new banner
          </span>
          <span className="text-xs text-(--text-muted)">
            PNG, JPG or WebP (max 5 MB) • Recommended 1600 × 600 px
          </span>
        </button>
      </SettingsCard>

      {/* ---------------- Brand colors ---------------- */}
      <SettingsCard
        title="Brand colors"
        description="Customize primary accent colors and page surfaces across customer checkout."
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <FormColorPicker
              label="Primary color"
              hint="Accent & CTAs"
              value={brandPrimary}
              onChange={(v) =>
                setValue("brand_colors.primary", v, { shouldDirty: true })
              }
              onReset={() =>
                setValue("brand_colors.primary", "#0D9488", {
                  shouldDirty: true,
                })
              }
              error={errors.brand_colors?.primary?.message}
            />
            <FormColorPicker
              label="Background color"
              hint="Canvas surface"
              value={brandBackground}
              onChange={(v) =>
                setValue("brand_colors.background", v, { shouldDirty: true })
              }
              onReset={() =>
                setValue("brand_colors.background", "#FAF8FF", {
                  shouldDirty: true,
                })
              }
              error={errors.brand_colors?.background?.message}
            />
          </div>

          {/* Live preview */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
                Button & checkout preview
              </span>
              <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                Active palette
              </span>
            </div>
            <div
              className="rounded-lg border border-(--border-light) p-4"
              style={{ backgroundColor: brandBackground }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="flex size-6 items-center justify-center rounded-full"
                    style={{ backgroundColor: brandPrimary }}
                  >
                    <Truck className="size-3 text-white" />
                  </span>
                  <span className="text-xs font-semibold text-(--text-primary)">
                    Power Zenox Gold
                  </span>
                </div>
                <span className="text-[14px] font-bold text-(--text-primary) tabular-nums">
                  ৳1,450
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-(--text-muted)">
                <span>Delivery: Inside Dhaka (+৳60)</span>
                <span>COD Verified</span>
              </div>
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: brandPrimary }}
              >
                <ShoppingCart className="icon-size" /> Order Now (COD)
              </button>
            </div>
          </div>
        </div>
      </SettingsCard>
    </SettingsLayout>
  )
}
