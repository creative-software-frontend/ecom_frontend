import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Phone,
  MessageCircle,
  Mail,
  Link as LinkIcon,
  Music2,
  Upload,
  Trash2,
} from "lucide-react"
import {
  SiFacebook,
  SiInstagram,
  SiYoutube,
} from "@icons-pack/react-simple-icons"
import { SettingsLayout, SettingsCard } from "../SettingsLayout"
import { FormField, FormTextarea, FormRow } from "../SettingsField"
import {
  storeSettingsSchema,
  type StoreSettingsFormValues,
} from "../../../schemas/storeSettingsSchema"
import type { StoreSettings } from "../../../types/settings"

/* ================================================================
   Mock data — replace with API data later
   ================================================================ */

const mockStore: StoreSettings = {
  name: "Power Zenox",
  tagline: "Natural Herbal Health & Wellness Solutions Bangladesh",
  description:
    "Leading online provider of premium herbal extracts, dietary supplements, and vitality formulations based in Dhaka, Bangladesh.",
  logo: null,
  contact: {
    phone: "01712345", // invalid on purpose — matches the screenshot
    phone_2: "01819-482910",
    whatsapp: "01712345678",
    whatsapp_2: "01711928374",
    email: "support@powerzenox.com",
    address: "House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh",
    google_maps_url:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3651.0129",
  },
  social: {
    facebook: "https://facebook.com/powerzenoxbd",
    instagram: "https://instagram.com/powerzenox.official",
    youtube: "https://youtube.com/@powerzenox",
    tiktok: "https://tiktok.com/@powerzenox_bd",
  },
}

/* ================================================================
   Store Tab
   ================================================================ */

export default function StoreTab() {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues: {
      name: mockStore.name,
      tagline: mockStore.tagline,
      description: mockStore.description ?? "",
      logo: mockStore.logo ?? null,
      contact: mockStore.contact,
      social: mockStore.social,
    },
  })

  const descriptionValue =
    useWatch({
      control,
      name: "description",
    }) ?? ""

  async function onSubmit(data: StoreSettingsFormValues) {
    // TODO: wire to settingsApi.updateStore(data) once backend is ready
    console.log("Save store settings", data)
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 400))
    reset(data) // mark clean
  }

  return (
    <SettingsLayout
      activeTab="store"
      isDirty={isDirty}
      isSaving={isSubmitting}
      onDiscard={() => reset()}
      onSave={handleSubmit(onSubmit)}
    >
      {/* ---------------- General information ---------------- */}
      <SettingsCard
        title="General information"
        description="Basic details about your business displayed across the customer storefront and invoices."
      >
        {/* Logo */}
        <div>
          <p className="mb-1.5 text-[12px] font-semibold text-(--text-primary)">
            Store logo
          </p>
          <div className="flex items-center gap-4">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-(--border-light) bg-(--bg-app)">
              <span className="text-[10px] font-medium text-(--text-muted)">
                Power Zenox
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-[12px] font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
              >
                <Upload className="size-3.5" />
                Upload new
              </button>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-(--text-muted)">
            PNG, JPG or WebP, square aspect ratio, maximum file size 2 MB.
          </p>
        </div>

        <FormRow>
          <FormField
            label="Store name"
            required
            placeholder="Power Zenox"
            error={errors.name?.message}
            {...register("name")}
          />
          <FormField
            label="Slogan"
            required
            placeholder="Your tagline"
            error={errors.tagline?.message}
            help="A short punchy line for checkout and header tags."
            {...register("tagline")}
          />
        </FormRow>

        <FormTextarea
          label="Description"
          rows={3}
          maxLength={300}
          showCounter
          placeholder="Describe your business briefly"
          error={errors.description?.message}
          value={descriptionValue}
          {...register("description")}
        />
      </SettingsCard>

      {/* ---------------- Contact information ---------------- */}
      <SettingsCard
        title="Contact information"
        description="Customer support lines, physical warehouse address, and Google Maps embed location."
        badge={
          Object.keys(errors.contact ?? {}).length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
              <span className="size-1.5 rounded-full bg-red-500" />
              {Object.keys(errors.contact ?? {}).length} Validation{" "}
              {Object.keys(errors.contact ?? {}).length === 1
                ? "issue"
                : "issues"}
            </span>
          ) : undefined
        }
      >
        <FormRow>
          <FormField
            label="Primary phone"
            required
            placeholder="01712345678"
            icon={<Phone className="size-4" />}
            error={errors.contact?.phone?.message}
            {...register("contact.phone")}
          />
          <FormField
            label="Phone 2 (optional)"
            placeholder="01812345678"
            icon={<Phone className="size-4" />}
            error={errors.contact?.phone_2?.message}
            help="Secondary dispatch line"
            {...register("contact.phone_2")}
          />
        </FormRow>

        <FormRow>
          <FormField
            label="WhatsApp 1"
            required
            placeholder="01712345678"
            icon={<MessageCircle className="size-4" />}
            error={errors.contact?.whatsapp?.message}
            {...register("contact.whatsapp")}
          />
          <FormField
            label="WhatsApp 2 (optional)"
            placeholder="01712345678"
            icon={<MessageCircle className="size-4" />}
            error={errors.contact?.whatsapp_2?.message}
            help="Customers can tap these to call or chat"
            {...register("contact.whatsapp_2")}
          />
        </FormRow>

        <FormField
          label="Email"
          type="email"
          placeholder="support@example.com"
          icon={<Mail className="size-4" />}
          error={errors.contact?.email?.message}
          help="For order notices & support inquiries"
          {...register("contact.email")}
        />

        <FormTextarea
          label="Warehouse / Office address"
          rows={2}
          placeholder="Street, area, city"
          error={errors.contact?.address?.message}
          {...register("contact.address")}
        />

        <FormField
          label="Google Maps embed URL"
          placeholder="https://www.google.com/maps/embed?pb=..."
          icon={<LinkIcon className="size-4" />}
          error={errors.contact?.google_maps_url?.message}
          help="Paste only the URL from Google Maps → Share → Embed a map (the src value)."
          {...register("contact.google_maps_url")}
        />
      </SettingsCard>

      {/* ---------------- Social media ---------------- */}
      <SettingsCard
        title="Social media"
        description="Connect official social channels linked in your website footer and order receipts."
      >
        <FormRow>
          <FormField
            label="Facebook"
            placeholder="https://facebook.com/yourpage"
            icon={<SiFacebook className="size-4" />}
            error={errors.social?.facebook?.message}
            {...register("social.facebook")}
          />
          <FormField
            label="Instagram"
            placeholder="https://instagram.com/yourhandle"
            icon={<SiInstagram className="size-4" />}
            error={errors.social?.instagram?.message}
            {...register("social.instagram")}
          />
          <FormField
            label="YouTube"
            placeholder="https://youtube.com/@yourchannel"
            icon={<SiYoutube className="size-4" />}
            error={errors.social?.youtube?.message}
            {...register("social.youtube")}
          />
          <FormField
            label="TikTok"
            placeholder="https://tiktok.com/@yourhandle"
            icon={<Music2 className="size-4" />}
            error={errors.social?.tiktok?.message}
            {...register("social.tiktok")}
          />
        </FormRow>
      </SettingsCard>
    </SettingsLayout>
  )
}
