import { useEffect, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react"
import { ApiError } from "../api/client"
import { settingsApi } from "../api/settingsApi"
import { useAuth } from "../auth/AuthProvider"
import { useStoreQuery, useUpdateStoreMutation } from "../hooks/useStoreQuery"
import type { StoreSettings } from "../types/settings"

type TabType = "store" | "security"

export function SettingsPage() {
  const { state: authState } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("store")

  /* ---------------- Store Settings (TanStack Query) ---------------- */
  const { data: storeData, isLoading, error, refetch } = useStoreQuery()
  const updateStore = useUpdateStoreMutation()

  // Local form state — ডেটা লোড হলে একবার সিঙ্ক করব
  const [formState, setFormState] = useState<StoreSettings | null>(null)
  const [storeSuccessMessage, setStoreSuccessMessage] = useState<string | null>(
    null
  )
  const [storeErrorMessage, setStoreErrorMessage] = useState<string | null>(
    null
  )
  const [storeFieldErrors, setStoreFieldErrors] = useState<
    Record<string, string>
  >({})

  // সার্ভার থেকে ডেটা আসলে form-এ কপি করি
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (storeData) setFormState(storeData)
  }, [storeData])

  /* ---------------- Password Change (আগের মতোই) ---------------- */
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<
    string | null
  >(null)
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<
    string | null
  >(null)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<
    Record<string, string>
  >({})

  /* ---------------- Handlers ---------------- */

  async function handleStoreSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!formState) return

    setStoreSuccessMessage(null)
    setStoreErrorMessage(null)
    setStoreFieldErrors({})

    try {
      await updateStore.mutateAsync(formState)
      setStoreSuccessMessage("Store settings saved successfully.")
    } catch (err) {
      if (err instanceof ApiError) {
        setStoreErrorMessage(err.message)
        if (err.fieldErrors) setStoreFieldErrors(err.fieldErrors)
      } else {
        setStoreErrorMessage("An unexpected error occurred while saving.")
      }
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordSuccessMessage(null)
    setPasswordErrorMessage(null)
    setPasswordFieldErrors({})

    if (newPassword.length < 8) {
      setPasswordFieldErrors({
        newPassword: "New password must be at least 8 characters long.",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordFieldErrors({ confirmPassword: "Passwords do not match." })
      return
    }

    setIsUpdatingPassword(true)
    try {
      const res = await settingsApi.changePassword({
        currentPassword,
        newPassword,
      })
      setPasswordSuccessMessage(res.message || "Password updated successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      if (err instanceof ApiError) {
        setPasswordErrorMessage(err.message)
        if (err.fieldErrors) setPasswordFieldErrors(err.fieldErrors)
      } else {
        setPasswordErrorMessage(
          "An unexpected error occurred while updating password."
        )
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  /* ---------------- Helper: update form field ---------------- */
  const updateField = <K extends keyof StoreSettings>(
    key: K,
    value: StoreSettings[K]
  ) => {
    setFormState((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  /* ---------------- Render ---------------- */

  return (
    <div className="min-w-0 space-y-6 bg-(--bg-app) p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-bold text-(--text-primary)">Settings</h1>
        <p className="mt-1 text-sm text-(--text-muted)">
          Manage your store configuration, contact details, delivery, and
          account security.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-(--border-light)">
        <button
          type="button"
          onClick={() => {
            setActiveTab("store")
            setStoreSuccessMessage(null)
            setStoreErrorMessage(null)
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "store"
              ? "border-primary text-primary"
              : "border-transparent text-(--text-muted) hover:text-(--text-primary)"
          }`}
        >
          <Store className="size-4" />
          Store Settings
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("security")
            setPasswordSuccessMessage(null)
            setPasswordErrorMessage(null)
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-(--text-muted) hover:text-(--text-primary)"
          }`}
        >
          <Lock className="size-4" />
          Security & Password
        </button>
      </div>

      {/* ------------------- STORE TAB ------------------- */}
      {activeTab === "store" && (
        <div className="space-y-6">
          {isLoading && (
            <div
              className="flex items-center justify-center rounded-lg border border-(--border-light) bg-(--bg-surface) p-12 text-sm text-(--text-muted)"
              role="status"
            >
              <Loader2 className="mr-2 size-5 animate-spin text-primary" />
              Loading store settings...
            </div>
          )}

          {error && !isLoading && (
            <div
              className="space-y-4 rounded-lg border border-(--border-light) bg-(--bg-surface) p-6"
              role="alert"
            >
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="size-5 shrink-0" />
                <p className="text-sm font-medium">
                  {error instanceof Error
                    ? error.message
                    : "Failed to load store settings"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void refetch()}
                className="admin-template-button admin-template-button--secondary"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && formState && (
            <form onSubmit={handleStoreSubmit} className="space-y-6">
              {/* Success / Error alerts */}
              {storeSuccessMessage && (
                <div
                  className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
                  role="status"
                >
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                  <span>{storeSuccessMessage}</span>
                </div>
              )}
              {storeErrorMessage && (
                <div
                  className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle className="size-5 shrink-0 text-red-600" />
                  <span>{storeErrorMessage}</span>
                </div>
              )}

              {/* Store Profile Card */}
              <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
                <div className="flex items-center gap-2 border-b border-(--border-light) px-6 py-4">
                  <Store className="size-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-(--text-primary)">
                      Store Profile
                    </h2>
                    <p className="text-xs text-(--text-muted)">
                      General details about your brand and online shop
                    </p>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="store-name"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Store Name
                      </label>
                      <input
                        id="store-name"
                        type="text"
                        value={formState.name}
                        onChange={(e) => updateField("name", e.target.value)}
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                      {storeFieldErrors.name && (
                        <p className="mt-1 text-xs text-red-600">
                          {storeFieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label
                        htmlFor="store-url"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Website URL
                      </label>
                      <input
                        id="store-url"
                        type="text"
                        value={formState.url}
                        onChange={(e) => updateField("url", e.target.value)}
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                      {storeFieldErrors.url && (
                        <p className="mt-1 text-xs text-red-600">
                          {storeFieldErrors.url}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="store-tagline"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Tagline / Slogan
                    </label>
                    <input
                      id="store-tagline"
                      type="text"
                      value={formState.tagline}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                    />
                    {storeFieldErrors.tagline && (
                      <p className="mt-1 text-xs text-red-600">
                        {storeFieldErrors.tagline}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor="store-currency"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Currency Code
                      </label>
                      <input
                        id="store-currency"
                        type="text"
                        value={formState.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                        placeholder="BDT"
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="store-currency-symbol"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Currency Symbol
                      </label>
                      <input
                        id="store-currency-symbol"
                        type="text"
                        value={formState.currency_symbol}
                        onChange={(e) =>
                          updateField("currency_symbol", e.target.value)
                        }
                        placeholder="৳"
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="store-language"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Language Code
                      </label>
                      <input
                        id="store-language"
                        type="text"
                        value={formState.language}
                        onChange={(e) =>
                          updateField("language", e.target.value)
                        }
                        placeholder="bn"
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Card */}
              <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
                <div className="flex items-center gap-2 border-b border-(--border-light) px-6 py-4">
                  <Phone className="size-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-(--text-primary)">
                      Contact & Support
                    </h2>
                    <p className="text-xs text-(--text-muted)">
                      Contact phone and WhatsApp support numbers shown to
                      customers
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      value={formState.contact.phone}
                      onChange={(e) =>
                        updateField("contact", {
                          ...formState.contact,
                          phone: e.target.value,
                        })
                      }
                      placeholder="017XXXXXXXX"
                      className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                    />
                    {storeFieldErrors["contact.phone"] && (
                      <p className="mt-1 text-xs text-red-600">
                        {storeFieldErrors["contact.phone"]}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-whatsapp"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      WhatsApp Number
                    </label>
                    <input
                      id="contact-whatsapp"
                      type="text"
                      value={formState.contact.whatsapp}
                      onChange={(e) =>
                        updateField("contact", {
                          ...formState.contact,
                          whatsapp: e.target.value,
                        })
                      }
                      placeholder="017XXXXXXXX"
                      className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                    />
                    {storeFieldErrors["contact.whatsapp"] && (
                      <p className="mt-1 text-xs text-red-600">
                        {storeFieldErrors["contact.whatsapp"]}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Delivery Card */}
              <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
                <div className="flex items-center gap-2 border-b border-(--border-light) px-6 py-4">
                  <Truck className="size-5 text-primary" />
                  <div>
                    <h2 className="text-base font-semibold text-(--text-primary)">
                      Delivery & Shipping
                    </h2>
                    <p className="text-xs text-(--text-muted)">
                      Default shipping policy, charges, and delivery notices
                    </p>
                  </div>
                </div>
                <div className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="delivery-method"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Delivery Method
                      </label>
                      <input
                        id="delivery-method"
                        type="text"
                        value={formState.delivery.method}
                        onChange={(e) =>
                          updateField("delivery", {
                            ...formState.delivery,
                            method: e.target.value,
                          })
                        }
                        placeholder="Cash on Delivery"
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="delivery-charge"
                        className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                      >
                        Delivery Charge ({formState.currency_symbol})
                      </label>
                      <input
                        id="delivery-charge"
                        type="number"
                        min="0"
                        value={formState.delivery.delivery_charge}
                        onChange={(e) =>
                          updateField("delivery", {
                            ...formState.delivery,
                            delivery_charge: Number(e.target.value) || 0,
                          })
                        }
                        className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formState.delivery.free_delivery}
                        onChange={(e) =>
                          updateField("delivery", {
                            ...formState.delivery,
                            free_delivery: e.target.checked,
                          })
                        }
                        className="size-4 rounded border-(--border-light) text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-(--text-primary)">
                        Enable Free Delivery Offer
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-(--text-muted)">
                      When checked, delivery is marked as free for customers.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="delivery-note"
                      className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                    >
                      Delivery Note
                    </label>
                    <input
                      id="delivery-note"
                      type="text"
                      value={formState.delivery.note}
                      onChange={(e) =>
                        updateField("delivery", {
                          ...formState.delivery,
                          note: e.target.value,
                        })
                      }
                      placeholder="সারা বাংলাদেশ ক্যাশ অন ডেলিভারি"
                      className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                    />
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={updateStore.isPending}
                  className="admin-template-button admin-template-button--primary px-6 disabled:opacity-50"
                >
                  {updateStore.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving settings...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Store Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ------------------- SECURITY TAB ------------------- */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {passwordSuccessMessage && (
            <div
              className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
              role="status"
            >
              <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}
          {passwordErrorMessage && (
            <div
              className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="size-5 shrink-0 text-red-600" />
              <span>{passwordErrorMessage}</span>
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
            <div className="flex items-center gap-2 border-b border-(--border-light) px-6 py-4">
              <KeyRound className="size-5 text-primary" />
              <div>
                <h2 className="text-base font-semibold text-(--text-primary)">
                  Change Password
                </h2>
                <p className="text-xs text-(--text-muted)">
                  Update your administrator account password
                </p>
              </div>
            </div>
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="max-w-md space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  />
                  {passwordFieldErrors.currentPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordFieldErrors.currentPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  />
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Must be at least 8 characters long.
                  </p>
                  {passwordFieldErrors.newPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordFieldErrors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="block w-full rounded-md border border-(--border-light) bg-(--bg-surface) px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-(--primary)/20"
                  />
                  {passwordFieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      {passwordFieldErrors.confirmPassword}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="admin-template-button admin-template-button--primary disabled:opacity-50"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {authState.status === "authenticated" && (
            <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
              <div className="flex items-center gap-2 border-b border-(--border-light) px-6 py-4">
                <ShieldCheck className="size-5 text-emerald-600" />
                <div>
                  <h2 className="text-base font-semibold text-(--text-primary)">
                    Account Info
                  </h2>
                  <p className="text-xs text-(--text-muted)">
                    Administrator account credentials
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="size-5 text-(--text-muted)" />
                  <div>
                    <div className="text-xs text-(--text-muted)">
                      Signed in as
                    </div>
                    <div className="text-sm font-medium text-(--text-primary)">
                      {authState.user.email}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default SettingsPage
