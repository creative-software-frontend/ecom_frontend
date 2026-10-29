import { useState, type FormEvent } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Navigate, useLocation, useNavigate, type Location } from "react-router"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"

type LoginNavigationState = {
  from?: Pick<Location, "pathname" | "search" | "hash">
}

function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again."
  }
  if (error.status === 401) return "Invalid email or password"
  if (error.status === 429) return error.message
  if (error.status === 0) {
    return "Cannot reach the server. Check your connection."
  }
  return "Something went wrong. Please try again."
}

export function LoginPage() {
  const { state, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  if (state.status === "authenticated") {
    return <Navigate to="/admin" replace />
  }

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] text-sm text-gray-600"
        role="status"
        aria-live="polite"
      >
        Loading admin…
      </div>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    if (!email.trim() || !password) {
      setErrorMessage("Enter your email and password.")
      return
    }

    setErrorMessage("")
    setIsPending(true)
    try {
      await login(email, password)
      const from = (location.state as LoginNavigationState | null)?.from
      navigate(
        from?.pathname
          ? { pathname: from.pathname, search: from.search, hash: from.hash }
          : "/admin",
        { replace: true },
      )
    } catch (error: unknown) {
      setErrorMessage(getLoginErrorMessage(error))
    } finally {
      setIsPending(false)
    }
  }

  return (
    <main className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] px-4 py-10">
      <section className="admin-dashboard-card w-full max-w-md bg-white p-6 sm:p-8">
        <div className="mb-7 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-[var(--admin-form-primary)]">
            ArchitectUI
          </p>
          <h1 className="text-2xl font-semibold text-[var(--admin-sidebar-text)]">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-[var(--admin-sidebar-submenu-text)]">
            Sign in to manage your store.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {errorMessage ? (
            <div
              className="mb-5 rounded border border-[var(--admin-form-error-color)]/30 bg-[var(--admin-form-error-color)]/5 px-3 py-2 text-sm text-[var(--admin-form-error-color)]"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="admin-email">
              Email
            </label>
            <input
              className="admin-form-control"
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="admin-password">
              Password
            </label>
            <div className="relative">
              <input
                className="admin-form-control pr-12"
                id="admin-password"
                name="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isPending}
              />
              <button
                className="admin-icon-button absolute top-1/2 right-1 -translate-y-1/2"
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
              >
                {passwordVisible ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button
            className="admin-template-button admin-template-button--primary mt-3 w-full"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
