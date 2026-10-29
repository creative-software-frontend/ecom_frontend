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
import type { StoreSettings } from "../types/settings"

type TabType = "store" | "security"

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; settings: StoreSettings }

export function SettingsPage() {
  const { state: authState } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>("store")

  // Store settings state
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" })
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null)
  const [isSavingStore, setIsSavingStore] = useState(false)
  const [storeSuccessMessage, setStoreSuccessMessage] = useState<string | null>(null)
  const [storeErrorMessage, setStoreErrorMessage] = useState<string | null>(null)
  const [storeFieldErrors, setStoreFieldErrors] = useState<Record<string, string>>({})

  // Security / Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null)
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null)
  const [passwordFieldErrors, setPasswordFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    settingsApi.get(controller.signal).then(
      (data) => {
        if (!active) return
        setStoreSettings(data)
        setLoadState({ status: "loaded", settings: data })
      },
      (error: unknown) => {
        if (!active) return
        if (error instanceof DOMException && error.name === "AbortError") return
        const message =
          error instanceof Error ? error.message : "Failed to load store settings"
        setLoadState({ status: "error", message })
      }
    )

    return () => {
      active = false
      controller.abort()
    }
  }, [loadAttempt])

  function handleRetry() {
    setLoadState({ status: "loading" })
    setLoadAttempt((c) => c + 1)
  }

  async function handleStoreSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!storeSettings) return

    setIsSavingStore(true)
    setStoreSuccessMessage(null)
    setStoreErrorMessage(null)
    setStoreFieldErrors({})

    try {
      const updated = await settingsApi.updateStore(storeSettings)
      setStoreSettings(updated)
      setStoreSuccessMessage("Store settings saved successfully.")
    } catch (error) {
      if (error instanceof ApiError) {
        setStoreErrorMessage(error.message)
        if (error.fieldErrors) {
          setStoreFieldErrors(error.fieldErrors)
        }
      } else {
        setStoreErrorMessage("An unexpected error occurred while saving.")
      }
    } finally {
      setIsSavingStore(false)
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
      setPasswordFieldErrors({
        confirmPassword: "Passwords do not match.",
      })
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
    } catch (error) {
      if (error instanceof ApiError) {
        setPasswordErrorMessage(error.message)
        if (error.fieldErrors) {
          setPasswordFieldErrors(error.fieldErrors)
        }
      } else {
        setPasswordErrorMessage("An unexpected error occurred while updating password.")
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
      <header className="admin-page-title">
        <h1 className="text-xl font-normal text-gray-800">Settings</h1>
        <p className="pt-[3px] text-base text-gray-500">
          Manage your store configuration, contact details, delivery, and account security.
        </p>
      </header>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("store")
            setStoreSuccessMessage(null)
            setStoreErrorMessage(null)
          }}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
            activeTab === "store"
              ? "border-[#3f6ad8] text-[#3f6ad8]"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
          aria-selected={activeTab === "store"}
          role="tab"
        >
          <Store className="h-4 w-4" />
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
              ? "border-[#3f6ad8] text-[#3f6ad8]"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
          aria-selected={activeTab === "security"}
          role="tab"
        >
          <Lock className="h-4 w-4" />
          Security & Password
        </button>
      </div>

      {/* Store Settings Tab */}
      {activeTab === "store" && (
        <div className="space-y-6">
          {loadState.status === "loading" ? (
            <div
              className="admin-dashboard-card flex items-center justify-center bg-white p-12 text-sm text-gray-500"
              role="status"
            >
              <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#3f6ad8]" />
              Loading store settings...
            </div>
          ) : loadState.status === "error" ? (
            <div
              className="admin-dashboard-card space-y-4 bg-white p-6"
              role="alert"
            >
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{loadState.message}</p>
              </div>
              <button
                type="button"
                onClick={handleRetry}
                className="admin-template-button admin-template-button--secondary"
              >
                Retry
              </button>
            </div>
          ) : storeSettings ? (
            <form onSubmit={(e) => void handleStoreSubmit(e)} className="space-y-6">
              {/* Feedback banners */}
              {storeSuccessMessage && (
                <div
                  className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                  role="status"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                  <span>{storeSuccessMessage}</span>
                </div>
              )}
              {storeErrorMessage && (
                <div
                  className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <span>{storeErrorMessage}</span>
                </div>
              )}

              {/* General Store Profile */}
              <section className="admin-dashboard-card overflow-hidden bg-white">
                <div className="admin-form-card-header flex items-center gap-2">
                  <Store className="h-5 w-5 text-[#3f6ad8]" />
                  <div>
                    <h2 className="text-base font-semibold">Store Profile</h2>
                    <p className="text-xs text-gray-500">
                      General details about your brand and online shop
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="admin-form-field">
                      <label htmlFor="store-name" className="admin-form-label">
                        Store Name
                      </label>
                      <input
                        id="store-name"
                        type="text"
                        value={storeSettings.name}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            name: e.target.value,
                          })
                        }
                        className="admin-form-control"
                        required
                        aria-invalid={Boolean(storeFieldErrors.name)}
                      />
                      {storeFieldErrors.name && (
                        <p className="admin-form-error">{storeFieldErrors.name}</p>
                      )}
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="store-url" className="admin-form-label">
                        Website URL
                      </label>
                      <input
                        id="store-url"
                        type="text"
                        value={storeSettings.url}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            url: e.target.value,
                          })
                        }
                        className="admin-form-control"
                        required
                        aria-invalid={Boolean(storeFieldErrors.url)}
                      />
                      {storeFieldErrors.url && (
                        <p className="admin-form-error">{storeFieldErrors.url}</p>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="store-tagline" className="admin-form-label">
                      Tagline / Slogan
                    </label>
                    <input
                      id="store-tagline"
                      type="text"
                      value={storeSettings.tagline}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          tagline: e.target.value,
                        })
                      }
                      className="admin-form-control"
                      required
                      aria-invalid={Boolean(storeFieldErrors.tagline)}
                    />
                    {storeFieldErrors.tagline && (
                      <p className="admin-form-error">{storeFieldErrors.tagline}</p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="admin-form-field">
                      <label htmlFor="store-currency" className="admin-form-label">
                        Currency Code
                      </label>
                      <input
                        id="store-currency"
                        type="text"
                        value={storeSettings.currency}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            currency: e.target.value,
                          })
                        }
                        className="admin-form-control"
                        required
                        placeholder="BDT"
                        aria-invalid={Boolean(storeFieldErrors.currency)}
                      />
                      {storeFieldErrors.currency && (
                        <p className="admin-form-error">{storeFieldErrors.currency}</p>
                      )}
                    </div>

                    <div className="admin-form-field">
                      <label
                        htmlFor="store-currency-symbol"
                        className="admin-form-label"
                      >
                        Currency Symbol
                      </label>
                      <input
                        id="store-currency-symbol"
                        type="text"
                        value={storeSettings.currency_symbol}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            currency_symbol: e.target.value,
                          })
                        }
                        className="admin-form-control"
                        required
                        placeholder="৳"
                        aria-invalid={Boolean(storeFieldErrors.currency_symbol)}
                      />
                      {storeFieldErrors.currency_symbol && (
                        <p className="admin-form-error">
                          {storeFieldErrors.currency_symbol}
                        </p>
                      )}
                    </div>

                    <div className="admin-form-field">
                      <label htmlFor="store-language" className="admin-form-label">
                        Language Code
                      </label>
                      <input
                        id="store-language"
                        type="text"
                        value={storeSettings.language}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            language: e.target.value,
                          })
                        }
                        className="admin-form-control"
                        required
                        placeholder="bn"
                        aria-invalid={Boolean(storeFieldErrors.language)}
                      />
                      {storeFieldErrors.language && (
                        <p className="admin-form-error">{storeFieldErrors.language}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Contact Information */}
              <section className="admin-dashboard-card overflow-hidden bg-white">
                <div className="admin-form-card-header flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#3f6ad8]" />
                  <div>
                    <h2 className="text-base font-semibold">Contact & Support</h2>
                    <p className="text-xs text-gray-500">
                      Contact phone and WhatsApp support numbers shown to customers
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <div className="admin-form-field">
                    <label htmlFor="contact-phone" className="admin-form-label">
                      Phone Number
                    </label>
                    <input
                      id="contact-phone"
                      type="text"
                      value={storeSettings.contact.phone}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          contact: {
                            ...storeSettings.contact,
                            phone: e.target.value,
                          },
                        })
                      }
                      className="admin-form-control"
                      required
                      placeholder="017XXXXXXXX"
                      aria-invalid={Boolean(storeFieldErrors["contact.phone"])}
                    />
                    {storeFieldErrors["contact.phone"] && (
                      <p className="admin-form-error">
                        {storeFieldErrors["contact.phone"]}
                      </p>
                    )}
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="contact-whatsapp" className="admin-form-label">
                      WhatsApp Number
                    </label>
                    <input
                      id="contact-whatsapp"
                      type="text"
                      value={storeSettings.contact.whatsapp}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          contact: {
                            ...storeSettings.contact,
                            whatsapp: e.target.value,
                          },
                        })
                      }
                      className="admin-form-control"
                      required
                      placeholder="017XXXXXXXX"
                      aria-invalid={Boolean(storeFieldErrors["contact.whatsapp"])}
                    />
                    {storeFieldErrors["contact.whatsapp"] && (
                      <p className="admin-form-error">
                        {storeFieldErrors["contact.whatsapp"]}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Delivery Settings */}
              <section className="admin-dashboard-card overflow-hidden bg-white">
                <div className="admin-form-card-header flex items-center gap-2">
                  <Truck className="h-5 w-5 text-[#3f6ad8]" />
                  <div>
                    <h2 className="text-base font-semibold">Delivery & Shipping</h2>
                    <p className="text-xs text-gray-500">
                      Default shipping policy, charges, and delivery notices
                    </p>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="admin-form-field">
                      <label htmlFor="delivery-method" className="admin-form-label">
                        Delivery Method
                      </label>
                      <input
                        id="delivery-method"
                        type="text"
                        value={storeSettings.delivery.method}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            delivery: {
                              ...storeSettings.delivery,
                              method: e.target.value,
                            },
                          })
                        }
                        className="admin-form-control"
                        required
                        placeholder="Cash on Delivery"
                        aria-invalid={Boolean(storeFieldErrors["delivery.method"])}
                      />
                      {storeFieldErrors["delivery.method"] && (
                        <p className="admin-form-error">
                          {storeFieldErrors["delivery.method"]}
                        </p>
                      )}
                    </div>

                    <div className="admin-form-field">
                      <label
                        htmlFor="delivery-charge"
                        className="admin-form-label"
                      >
                        Delivery Charge ({storeSettings.currency_symbol})
                      </label>
                      <input
                        id="delivery-charge"
                        type="number"
                        min="0"
                        value={storeSettings.delivery.delivery_charge}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            delivery: {
                              ...storeSettings.delivery,
                              delivery_charge: Number(e.target.value) || 0,
                            },
                          })
                        }
                        className="admin-form-control"
                        required
                        aria-invalid={Boolean(
                          storeFieldErrors["delivery.delivery_charge"]
                        )}
                      />
                      {storeFieldErrors["delivery.delivery_charge"] && (
                        <p className="admin-form-error">
                          {storeFieldErrors["delivery.delivery_charge"]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="admin-form-field">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={storeSettings.delivery.free_delivery}
                        onChange={(e) =>
                          setStoreSettings({
                            ...storeSettings,
                            delivery: {
                              ...storeSettings.delivery,
                              free_delivery: e.target.checked,
                            },
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-[#3f6ad8] focus:ring-[#3f6ad8]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Enable Free Delivery Offer
                      </span>
                    </label>
                    <p className="admin-form-help">
                      When checked, delivery is marked as free for customers.
                    </p>
                  </div>

                  <div className="admin-form-field">
                    <label htmlFor="delivery-note" className="admin-form-label">
                      Delivery Note
                    </label>
                    <input
                      id="delivery-note"
                      type="text"
                      value={storeSettings.delivery.note}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          delivery: {
                            ...storeSettings.delivery,
                            note: e.target.value,
                          },
                        })
                      }
                      className="admin-form-control"
                      placeholder="সারা বাংলাদেশ ক্যাশ অন ডেলিভারি"
                      aria-invalid={Boolean(storeFieldErrors["delivery.note"])}
                    />
                    {storeFieldErrors["delivery.note"] && (
                      <p className="admin-form-error">
                        {storeFieldErrors["delivery.note"]}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingStore}
                  className="admin-template-button admin-template-button--primary px-6"
                >
                  {isSavingStore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving settings...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Store Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Feedback banners */}
          {passwordSuccessMessage && (
            <div
              className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
              role="status"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
              <span>{passwordSuccessMessage}</span>
            </div>
          )}
          {passwordErrorMessage && (
            <div
              className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
              <span>{passwordErrorMessage}</span>
            </div>
          )}

          {/* Change Password Card */}
          <section className="admin-dashboard-card overflow-hidden bg-white">
            <div className="admin-form-card-header flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#3f6ad8]" />
              <div>
                <h2 className="text-base font-semibold">Change Password</h2>
                <p className="text-xs text-gray-500">
                  Update your administrator account password
                </p>
              </div>
            </div>

            <form onSubmit={(e) => void handlePasswordSubmit(e)} className="p-6">
              <div className="max-w-md space-y-4">
                <div className="admin-form-field">
                  <label htmlFor="current-password" className="admin-form-label">
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
                  />
                  {passwordFieldErrors.currentPassword && (
                    <p className="admin-form-error">
                      {passwordFieldErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="admin-form-field">
                  <label htmlFor="new-password" className="admin-form-label">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.newPassword)}
                  />
                  <p className="admin-form-help">
                    Must be at least 8 characters long.
                  </p>
                  {passwordFieldErrors.newPassword && (
                    <p className="admin-form-error">
                      {passwordFieldErrors.newPassword}
                    </p>
                  )}
                </div>

                <div className="admin-form-field">
                  <label htmlFor="confirm-password" className="admin-form-label">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                  />
                  {passwordFieldErrors.confirmPassword && (
                    <p className="admin-form-error">
                      {passwordFieldErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="admin-template-button admin-template-button--primary"
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating password...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Account Summary */}
          {authState.status === "authenticated" && (
            <section className="admin-dashboard-card overflow-hidden bg-white">
              <div className="admin-form-card-header flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <div>
                  <h2 className="text-base font-semibold">Account Info</h2>
                  <p className="text-xs text-gray-500">
                    Administrator account credentials
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Signed in as</div>
                    <div className="font-medium text-gray-800">
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
