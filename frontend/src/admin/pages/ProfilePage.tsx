import { useState } from "react"
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Save,
  // Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { useNavigate } from "react-router"
import { ApiError } from "../api/client"
import { profileApi } from "../api/profileApi"
import { settingsApi } from "../api/settingsApi"
import { useAuth } from "../auth/AuthProvider"
import { formatLongDate } from "../lib/formatTime"

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
        className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-(--text-muted)"
        role="status"
      >
        <Loader2 className="mr-2 size-4 animate-spin text-primary" />
        Loading profile...
      </div>
    )
  }

  const { user } = state
  const initials = (user.email.slice(0, 1) || "A").toLocaleUpperCase()

  async function handleCopyId() {
    try {
      await navigator.clipboard.writeText(String(user.id))
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
    const isSuperAdmin = user.role === "super_admin"
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error: unknown) {
      console.error("Admin logout failed", error)
    } finally {
      navigate(isSuperAdmin ? "/admin/login" : "/login", { replace: true })
    }
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">
            Admin Profile
          </h1>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Manage your administrator account details, security credentials, and
            active session.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Profile Hero Header Card */}
        <section
          className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)"
          aria-labelledby="profile-account-heading"
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-(--primary-soft) text-xl font-bold text-primary ring-4 ring-(--primary-soft)"
                aria-hidden="true"
              >
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="profile-account-heading"
                    className="truncate text-base font-semibold text-(--text-primary)"
                  >
                    {user.email}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    <span className="size-1.5 rounded-full bg-emerald-600" />
                    Active
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-(--text-muted)">
                  <ShieldCheck
                    className="size-3.5 text-emerald-600"
                    aria-hidden
                  />
                  {user.role === "super_admin"
                    ? "Super Administrator • Platform Full Access"
                    : "Store Administrator • Full Access"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* <button
                type="button"
                onClick={() => navigate("/admin/settings")}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
              >
                <Settings className="size-3.5" />
                Store Settings
              </button> */}
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-200 bg-red-50/50 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <LogOut className="size-3.5" />
                )}
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* Edit Profile Information Form */}
        <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
          <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-3">
            <UserRound className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Account Information
              </h2>
              <p className="text-xs text-(--text-muted)">
                Update your login email address and view account credentials
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleProfileSubmit(e)} className="p-5">
            {profileSuccessMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>{profileSuccessMessage}</span>
              </div>
            )}
            {profileErrorMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0 text-red-600" />
                <span>{profileErrorMessage}</span>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-10 pl-3 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                    required
                  />
                  <Mail className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-(--text-muted)" />
                </div>
                <p className="mt-1 text-xs text-(--text-muted)">
                  This email is used to log in to the admin dashboard.
                </p>
              </div>

              <div>
                <label
                  htmlFor="admin-id"
                  className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                >
                  Admin ID
                </label>
                <div className="flex gap-2">
                  <input
                    id="admin-id"
                    type="text"
                    value={String(user.id)}
                    readOnly
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) px-3 font-mono text-xs text-(--text-muted) outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => void handleCopyId()}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
                    title="Copy Admin ID"
                    aria-label="Copy Admin ID"
                  >
                    {copiedId ? (
                      <>
                        <Check className="size-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5 text-(--text-muted)" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-(--text-muted)">
                  Unique system identifier for your administrator record.
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={isSavingEmail}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
              >
                {isSavingEmail ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" />
                    Save Account Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* Change Password Card */}
        <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
          <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-3">
            <KeyRound className="size-4 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Change Password
              </h2>
              <p className="text-xs text-(--text-muted)">
                Update your login password to keep your store secure
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handlePasswordSubmit(e)} className="p-5">
            {passwordSuccessMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"
                role="status"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccessMessage}</span>
              </div>
            )}
            {passwordErrorMessage && (
              <div
                className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800"
                role="alert"
              >
                <AlertCircle className="size-4 shrink-0 text-red-600" />
                <span>{passwordErrorMessage}</span>
              </div>
            )}

            <div className="max-w-md space-y-4">
              <div>
                <label
                  htmlFor="profile-current-password"
                  className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                >
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={visibleCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-10 pl-3 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.currentPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleCurrentPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary)"
                    aria-label={
                      visibleCurrentPassword ? "Hide password" : "Show password"
                    }
                  >
                    {visibleCurrentPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {passwordFieldErrors.currentPassword && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {passwordFieldErrors.currentPassword}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="profile-new-password"
                  className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                >
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-new-password"
                    type={visibleNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-10 pl-3 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.newPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleNewPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary)"
                    aria-label={
                      visibleNewPassword ? "Hide password" : "Show password"
                    }
                  >
                    {visibleNewPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <p className="mt-1 text-xs text-(--text-muted)">
                  Must be at least 8 characters long.
                </p>
                {passwordFieldErrors.newPassword && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {passwordFieldErrors.newPassword}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="profile-confirm-password"
                  className="mb-1.5 block text-xs font-semibold text-(--text-primary)"
                >
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-confirm-password"
                    type={visibleConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block h-9 w-full rounded-md border border-(--border-light) bg-(--bg-app) pr-10 pl-3 text-xs text-(--text-primary) transition-all outline-none focus:border-primary focus:bg-(--bg-surface) focus:ring-2 focus:ring-(--primary)/20"
                    required
                    aria-invalid={Boolean(passwordFieldErrors.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setVisibleConfirmPassword((v) => !v)}
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary)"
                    aria-label={
                      visibleConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {visibleConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>

                {passwordFieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {passwordFieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover) disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Updating password...
                    </>
                  ) : (
                    <>
                      <Lock className="size-3.5" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Security & System Metadata Overview */}
        <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
          <div className="flex items-center gap-2 border-b border-(--border-light) px-5 py-3">
            <ShieldCheck className="size-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">
                Security & Session Status
              </h2>
              <p className="text-xs text-(--text-muted)">
                Overview of current session credentials and security settings
              </p>
            </div>
          </div>

          <dl className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="flex items-start gap-3 rounded-lg border border-(--border-light) bg-(--bg-app) p-3.5">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-(--text-muted)">
                  Authentication
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-(--text-primary)">
                  HTTP-Only JWT Cookie
                </dd>
                <dd className="mt-0.5 text-[11px] text-(--text-muted)">
                  8-hour session lifespan
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-(--border-light) bg-(--bg-app) p-3.5">
              <IdCard className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-(--text-muted)">
                  Role Permissions
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-(--text-primary)">
                  {user.role === "super_admin"
                    ? "Super Administrator"
                    : "Store Administrator"}
                </dd>
                <dd className="mt-0.5 text-[11px] text-(--text-muted)">
                  {user.role === "super_admin"
                    ? "Full platform management"
                    : "Full catalog & store access"}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-(--border-light) bg-(--bg-app) p-3.5">
              <Calendar className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-(--text-muted)">
                  Member Since
                </dt>
                <dd className="mt-0.5 text-xs font-semibold text-(--text-primary)">
                  {formatLongDate(user.createdAt)}
                </dd>
                <dd className="mt-0.5 text-[11px] text-(--text-muted)">
                  Account verified
                </dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}

export default ProfilePage
