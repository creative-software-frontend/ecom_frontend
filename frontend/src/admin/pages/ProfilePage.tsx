import { IdCard, Mail, ShieldCheck, UserRound } from "lucide-react"
import { useAuth } from "../auth/AuthProvider"

export function ProfilePage() {
  const { state } = useAuth()

  if (state.status !== "authenticated") {
    return (
      <div
        className="admin-dashboard-content min-w-0 p-4 md:p-[30px]"
        role="status"
      >
        Loading profile...
      </div>
    )
  }

  const { user } = state
  const initials = user.email.slice(0, 1).toLocaleUpperCase()

  return (
    <div className="admin-dashboard-content min-w-0 p-4 md:p-[30px]">
      <header className="admin-page-title">
        <h1 className="text-xl font-normal text-gray-800">Admin profile</h1>
        <p className="pt-[3px] text-base text-gray-500">
          View the account currently signed in to your store admin.
        </p>
      </header>

      <section
        className="admin-dashboard-card overflow-hidden bg-white"
        aria-labelledby="profile-account-heading"
      >
        <div className="flex flex-col gap-5 border-b border-gray-200 p-6 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-(--admin-form-primary)"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <h2
              id="profile-account-heading"
              className="text-lg font-semibold text-gray-800"
            >
              {user.email}
            </h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <ShieldCheck className="h-4 w-4 text-green-600" aria-hidden />
              Signed in as an administrator
            </p>
          </div>
        </div>

        <dl className="grid gap-4 p-6 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
            <Mail
              className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-sm font-medium text-gray-500">
                Email address
              </dt>
              <dd className="mt-1 break-all text-sm text-gray-800">
                {user.email}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border border-gray-200 p-4">
            <IdCard
              className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <dt className="text-sm font-medium text-gray-500">Admin ID</dt>
              <dd className="mt-1 break-all text-sm text-gray-800">
                {user.id}
              </dd>
            </div>
          </div>
        </dl>

        <div className="flex items-start gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <UserRound
            className="mt-0.5 h-5 w-5 shrink-0 text-gray-500"
            aria-hidden="true"
          />
          <p className="text-sm text-gray-600">
            Profile details are managed by your store administrator. Contact
            them if your account information needs to change.
          </p>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
