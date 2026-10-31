import { useState } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  IdCard,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useNavigate } from "react-router"
import { ApiError } from "../api/client"
import { profileApi } from "../api/profileApi"
import { settingsApi } from "../api/settingsApi"
import { useAuth } from "../auth/AuthProvider"
import { PasswordShowHide } from "../components/PasswordShowHide"

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A"
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  } catch {
    return "N/A"
  }
}

export function ProfilePage() {
  const { state, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  // Account details form state
  const currentUser = state.status === "authenticated" ? state.user : null
  const [email, setEmail] = useState(() => currentUser?.email ?? "")
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<
    string | null
  >(null)
  const [profileErrorMessage, setProfileErrorMessage] = useState<string | null>(
    null
  )
  const [copiedId, setCopiedId] = useState(false)

  // Password update form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [visibleCurrentPassword, setVisibleCurrentPassword] =
    useState<boolean>(false)
  const [newPassword, setNewPassword] = useState("")
  const [visibleNewPassword, setVisibleNewPassword] = useState<boolean>(false)

  const [confirmPassword, setConfirmPassword] = useState("")
  const [visibleConfirmPassword, setVisibleConfirmPassword] =
    useState<boolean>(false)

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

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  if (state.status !== "authenticated" || !currentUser) {
    return (
      <div
        className="min-w-0 p-4 admin-dashboard-content md:p-7.5"
        role="status"
      >
        Loading profile...
      </div>
    )
  }

  const { user } = state
  const initials = (user.email.slice(0, 1) || "A").toLocaleUpperCase()

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(user.id)
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } catch {
      // ignore
    }
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setProfileSuccessMessage(null)
    setProfileErrorMessage(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setProfileErrorMessage("Email address cannot be empty.")
      return
    }

    if (trimmedEmail === user.email) {
      setProfileSuccessMessage("Profile is already up to date.")
      return
    }

    setIsSavingEmail(true)

    try {
      const updatedUser = await profileApi.updateProfile({
        email: trimmedEmail,
      })
      updateUser(updatedUser)
      setEmail(updatedUser.email)
      setProfileSuccessMessage("Profile email updated successfully.")
    } catch (error) {
      if (error instanceof ApiError) {
        setProfileErrorMessage(error.message)
      } else {
        setProfileErrorMessage("Failed to update profile.")
      }
    } finally {
      setIsSavingEmail(false)
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
        setPasswordErrorMessage(
          "An unexpected error occurred while updating password."
        )
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error: unknown) {
      console.error("Admin logout failed", error)
    } finally {
      navigate("/admin/login", { replace: true })
    }
  }

  return (
    <div className="min-w-0 p-4 admin-dashboard-content md:p-[30px]">
      <header className="admin-page-title">
        <h1 className="text-xl font-normal text-gray-800">Admin profile</h1>
        <p className="pt-[3px] text-base text-gray-500">
          Manage your administrator account details, security credentials, and
          active session.
        </p>
      </header>

      <div className="space-y-6">
        {/* Profile Hero Header Card */}
        <section
          className="overflow-hidden admin-dashboard-card bg-white"
          aria-labelledby="profile-account-heading"
        >
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-[#3f6ad8] ring-4 ring-blue-50"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="profile-account-heading"
                    className="text-lg font-semibold text-gray-800"
                  >
                    {user.email}
                  </h2>
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Active
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden />
                  Store Administrator • Full Access
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/admin/settings")}
                className="admin-template-button admin-template-button--secondary"
              >
                <Settings className="h-4 w-4" />
                Store Settings
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="admin-template-button admin-template-button--secondary text-red-600 hover:border-red-300 hover:bg-red-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* Edit Profile Information Form */}
        <section className="overflow-hidden admin-dashboard-card bg-white">
          <div className="flex items-center gap-2 admin-form-card-header">
            <UserRound className="h-5 w-5 text-[#3f6ad8]" />
            <div>
              <h2 className="text-base font-semibold">Account Information</h2>
              <p className="text-xs text-gray-500">
                Update your login email address and view account credentials
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleProfileSubmit(e)} className="p-6">
            {profileSuccessMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                role="status"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>{profileSuccessMessage}</span>
              </div>
            )}
            {profileErrorMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <span>{profileErrorMessage}</span>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              <div className="admin-form-field">
                <label htmlFor="admin-email" className="admin-form-label">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="admin-form-control pr-10"
                    required
                  />
                  <Mail className="pointer-events-none absolute top-2.5 right-3 h-4 w-4 text-gray-400" />
                </div>
                <p className="admin-form-help">
                  This email is used to log in to the admin dashboard.
                </p>
              </div>

              <div className="admin-form-field">
                <label htmlFor="admin-id" className="admin-form-label">
                  Admin ID
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-id"
                    type="text"
                    value={user.id}
                    readOnly
                    className="admin-form-control--readonly admin-form-control font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyId()}
                    className="admin-template-button shrink-0 admin-template-button--secondary"
                    title="Copy Admin ID"
                    aria-label="Copy Admin ID"
                  >
                    {copiedId ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="admin-form-help">
                  Unique system identifier for your administrator record.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingEmail}
                className="admin-template-button admin-template-button--primary"
              >
                {isSavingEmail ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Account Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password Card */}
        <section className="overflow-hidden admin-dashboard-card bg-white">
          <div className="flex items-center gap-2 admin-form-card-header">
            <KeyRound className="h-5 w-5 text-[#3f6ad8]" />
            <div>
              <h2 className="text-base font-semibold">Change Password</h2>
              <p className="text-xs text-gray-500">
                Update your login password to keep your store secure
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handlePasswordSubmit(e)} className="p-6">
            {passwordSuccessMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800"
                role="status"
              >
                <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                <span>{passwordSuccessMessage}</span>
              </div>
            )}
            {passwordErrorMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <span>{passwordErrorMessage}</span>
              </div>
            )}

            <div className="max-w-md space-y-4">
              <div className="admin-form-field">
                <label
                  htmlFor="profile-current-password"
                  className="admin-form-label"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={visibleCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
                  />
                  <PasswordShowHide
                    passwordVisible={visibleCurrentPassword}
                    setPasswordVisible={setVisibleCurrentPassword}
                  />
                </div>

                {passwordFieldErrors.currentPassword && (
                  <p className="admin-form-error">
                    {passwordFieldErrors.currentPassword}
                  </p>
                )}
              </div>

              <div className="admin-form-field">
                <label
                  htmlFor="profile-new-password"
                  className="admin-form-label"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={visibleNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.newPassword)}
                  />
                  <PasswordShowHide
                    passwordVisible={visibleNewPassword}
                    setPasswordVisible={setVisibleNewPassword}
                  />
                </div>
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
                <label
                  htmlFor="profile-confirm-password"
                  className="admin-form-label"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={visibleConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="admin-form-control"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                  />

                  <PasswordShowHide
                    passwordVisible={visibleConfirmPassword}
                    setPasswordVisible={setVisibleConfirmPassword}
                  />
                </div>

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

        {/* Security & System Metadata Overview */}
        <section className="overflow-hidden admin-dashboard-card bg-white">
          <div className="flex items-center gap-2 admin-form-card-header">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div>
              <h2 className="text-base font-semibold">
                Security & Session Status
              </h2>
              <p className="text-xs text-gray-500">
                Overview of current session credentials and security settings
              </p>
            </div>
          </div>

          <dl className="grid gap-4 p-6 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-gray-500">
                  Authentication
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-800">
                  HTTP-Only JWT Cookie
                </dd>
                <dd className="text-xs text-gray-500">
                  8-hour session lifespan
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
              <IdCard className="mt-0.5 h-5 w-5 shrink-0 text-[#3f6ad8]" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-gray-500">
                  Role Permissions
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-800">
                  Super Administrator
                </dd>
                <dd className="text-xs text-gray-500">
                  Full catalog & store access
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-gray-500">
                  Member Since
                </dt>
                <dd className="mt-1 text-sm font-semibold text-gray-800">
                  {formatDate(user.createdAt)}
                </dd>
                <dd className="text-xs text-gray-500">Account verified</dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

export default ProfilePage
